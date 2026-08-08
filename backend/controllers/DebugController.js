const ResumeBuilder = require("../services/ResumeBuilderService");
const CoverBuilder = require("../services/CoverBuilderService");

class DebugController {
    /**
     * Public entry point for the "Calcule" pagination.
     */
    async pagination(req, res) {
        try {
            const {type} = req.query;
            const document = req.body;
            
            const capturedLogs = [];
            const originalLog = console.log;
            console.log = (...args) => {
                capturedLogs.push(args.join(" "));
                originalLog(...args);
            };

            // Selects the generation logic based on the `type` parameter
            let paginationResult;
            if (type.toLowerCase() === "cover") {
                paginationResult = await CoverBuilder.debugPagination(document || {});
            } else {
                paginationResult = await ResumeBuilder.debugPagination(document || {});
            }

            console.log = originalLog;

            return res.json({
                success: true,
                logs: capturedLogs,
                pageHeightPx: paginationResult.pageHeightPx,
                totalPages: paginationResult.totalPages,
                html: paginationResult.html
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new DebugController();