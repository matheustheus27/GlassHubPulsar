const assert = require('assert');
const notificationService = require('../services/NotificationService');

async function runNotificationTests() {
  console.log('\n=== RUNNING PERSISTENT NOTIFICATION TESTS ===\n');

  const testUserId = 'test_user_12345';

  // 1. Create a PDF Export Ready notification
  const pdfNotif = await notificationService.createNotification({
    userId: testUserId,
    title: 'Exportação de PDF Concluída',
    message: 'Seu currículo "Curriculo_Alexandre_Santos_pt-BR.pdf" está pronto para download.',
    type: 'PDF_READY',
    data: {
      jobId: 'job_pdf_999',
      fileName: 'Curriculo_Alexandre_Santos_pt-BR.pdf',
      downloadUrl: '/api/pdf/download/job_pdf_999'
    }
  });

  assert(pdfNotif, 'Notification must be created');
  assert.strictEqual(pdfNotif.userId, testUserId);
  assert.strictEqual(pdfNotif.read, false);
  console.log('✅ Test 1 Passed: PDF completion notification created successfully.');

  // 2. Create an ATS Scoring notification
  const atsNotif = await notificationService.createNotification({
    userId: testUserId,
    title: 'Avaliação ATS Concluída',
    message: 'Seu currículo atingiu Score 85/100.',
    type: 'ATS_ANALYSIS_COMPLETED',
    data: { score: 85 }
  });

  assert(atsNotif, 'ATS notification must be created');
  console.log('✅ Test 2 Passed: ATS evaluation notification created successfully.');

  // 3. List notifications and verify unread count
  const listResult = await notificationService.getUserNotifications(testUserId);
  assert(listResult.notifications.length >= 2, 'Must return at least 2 notifications');
  assert(listResult.unreadCount >= 2, 'Must have at least 2 unread notifications');
  console.log(`✅ Test 3 Passed: User notifications retrieved (Count: ${listResult.notifications.length}, Unread: ${listResult.unreadCount}).`);

  // 4. Mark specific notification as read
  await notificationService.markAsRead(pdfNotif.id, testUserId);
  const updatedList = await notificationService.getUserNotifications(testUserId);
  const foundPdf = updatedList.notifications.find(n => n.id === pdfNotif.id);
  assert.strictEqual(foundPdf.read, true, 'Target notification must be marked as read');
  assert.strictEqual(updatedList.unreadCount, listResult.unreadCount - 1, 'Unread count must decrement by 1');
  console.log('✅ Test 4 Passed: Individual notification marked as read.');

  // 5. Mark all as read
  await notificationService.markAllAsRead(testUserId);
  const finalCount = await notificationService.getUnreadCount(testUserId);
  assert.strictEqual(finalCount, 0, 'Unread count must be 0 after markAllAsRead');
  console.log('✅ Test 5 Passed: All notifications marked as read.');

  console.log('\n🎉 ALL NOTIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

if (require.main === module) {
  runNotificationTests().catch(err => {
    console.error('Notification test failed:', err);
    process.exit(1);
  });
}

module.exports = runNotificationTests;
