/**
 * Support Controller
 * Handles Help Desk tickets, real-time agent live chat, and 30-day account deletion operations.
 */
const prisma = require('../prisma/client');
const supportService = require('../services/SupportService');
const logger = require('../utils/logger');

class SupportController {
  async createTicket(req, res) {
    try {
      const userId = req.user?.id;
      const userName = req.user?.name || 'Usuário';
      const userEmail = req.user?.email || 'usuario@exemplo.com';
      const { type = 'GENERAL', subject, description } = req.body;

      if (!subject || !description) {
        return res.status(400).json({ success: false, error: 'Assunto e descrição são obrigatórios' });
      }

      const initialMessage = {
        id: `msg_${Date.now()}`,
        sender: 'USER',
        senderName: userName,
        text: description,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          userName,
          userEmail,
          type,
          subject,
          description,
          status: 'OPEN',
          messages: [initialMessage]
        }
      });

      logger.info(`[SupportController] New ticket [${ticket.id}] created by ${userEmail} (${type})`);

      return res.status(201).json({
        success: true,
        message: 'Chamado aberto com sucesso! Um atendente responderá em breve.',
        ticket
      });
    } catch (err) {
      logger.error('Error creating support ticket:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async listTickets(req, res) {
    try {
      const user = req.user;
      let tickets;

      if (user.role === 'ADMIN') {
        tickets = await prisma.supportTicket.findMany({
          orderBy: { createdAt: 'desc' }
        });
      } else {
        tickets = await prisma.supportTicket.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        });
      }

      return res.json({ success: true, tickets: tickets || [] });
    } catch (err) {
      logger.error('Error listing support tickets:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const ticket = await prisma.supportTicket.findUnique({ where: { id } });

      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Chamado não encontrado' });
      }

      // Check ownership or admin
      if (req.user.role !== 'ADMIN' && ticket.userId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Acesso negado a este chamado' });
      }

      return res.json({ success: true, ticket });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const user = req.user;

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Mensagem não pode ser vazia' });
      }

      const ticket = await prisma.supportTicket.findUnique({ where: { id } });
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Chamado não encontrado' });
      }

      const isSenderAdmin = user.role === 'ADMIN';
      const newMessage = {
        id: `msg_${Date.now()}`,
        sender: isSenderAdmin ? 'ADMIN' : 'USER',
        senderName: user.name || (isSenderAdmin ? 'Suporte GlassHub' : 'Cliente'),
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const currentMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
      const updatedMessages = [...currentMessages, newMessage];

      const updated = await prisma.supportTicket.update({
        where: { id },
        data: {
          messages: updatedMessages,
          status: isSenderAdmin && ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status
        }
      });

      // Broadcast real-time message to active live chat room
      supportService.broadcastToTicket(id, 'new_message', { ticketId: id, message: newMessage });

      return res.json({ success: true, message: newMessage, ticket: updated });
    } catch (err) {
      logger.error('Error sending support message:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async acceptTicket(req, res) {
    try {
      const { id } = req.params;
      const adminName = req.user.name || 'Atendente Suporte';

      const updated = await prisma.supportTicket.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          assignedTo: adminName
        }
      });

      const acceptMsg = {
        id: `msg_${Date.now()}`,
        sender: 'ADMIN',
        senderName: adminName,
        text: `Olá! Sou ${adminName} do Suporte GlassHub e estou atendendo seu chamado agora em tempo real. Como posso te ajudar?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const messages = Array.isArray(updated.messages) ? [...updated.messages, acceptMsg] : [acceptMsg];
      await prisma.supportTicket.update({
        where: { id },
        data: { messages }
      });

      supportService.broadcastToTicket(id, 'agent_joined', {
        ticketId: id,
        agentName: adminName,
        message: acceptMsg
      });

      return res.json({ success: true, message: 'Chamado aceito!', ticket: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async resolveTicket(req, res) {
    try {
      const { id } = req.params;
      const updated = await prisma.supportTicket.update({
        where: { id },
        data: { status: 'RESOLVED' }
      });

      supportService.broadcastToTicket(id, 'ticket_resolved', { ticketId: id });
      return res.json({ success: true, message: 'Chamado finalizado com sucesso!', ticket: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Admin executes account deletion from ticket
   */
  async executeAccountDeletion(req, res) {
    try {
      const { ticketId, userId } = req.body;
      const adminName = req.user.name || 'Administrador';

      let targetUserId = userId;
      if (ticketId) {
        const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
        if (ticket) targetUserId = ticket.userId;
      }

      if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'ID de usuário obrigatório' });
      }

      const deletionResult = await supportService.queueAccountDeletion(targetUserId, adminName);

      if (ticketId) {
        const systemMessage = {
          id: `msg_${Date.now()}`,
          sender: 'ADMIN',
          senderName: 'Sistema GlassHub',
          text: `⚠️ A solicitação de exclusão foi processada. A conta [${deletionResult.userEmail}] foi desativada e agendada para exclusão definitiva em 30 dias (${deletionResult.scheduledDate.toLocaleDateString()}). Um e-mail com instruções e link de recuperação foi enviado.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
        const msgs = Array.isArray(ticket?.messages) ? [...ticket.messages, systemMessage] : [systemMessage];

        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'RESOLVED', messages: msgs }
        });

        supportService.broadcastToTicket(ticketId, 'account_deleted', {
          ticketId,
          deletionResult
        });
      }

      return res.json({
        success: true,
        message: `Conta de ${deletionResult.userEmail} desativada e colocada na fila de 30 dias para exclusão definitiva.`,
        deletionResult
      });
    } catch (err) {
      logger.error('Error executing account deletion:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Public Account Recovery Endpoint
   */
  async recoverAccount(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token de recuperação obrigatório' });
      }

      const result = await supportService.recoverAccount(token);
      return res.json({ success: true, message: result.message, userEmail: result.userEmail });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Live Support Chat Streaming (Real-time SSE channel)
   */
  connectLiveChatStream(req, res) {
    const { ticketId } = req.params;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', ticketId })}\n\n`);

    const clientCallback = (event, data) => {
      res.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
    };

    supportService.registerClient(ticketId, clientCallback);

    req.on('close', () => {
      supportService.unregisterClient(ticketId, clientCallback);
    });
  }
}

module.exports = new SupportController();
