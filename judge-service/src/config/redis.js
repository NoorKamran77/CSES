app.get("/test", async (req, res) => {
    try {
        const job = await submissionQueue.add("hello", {
            message: "Hello Worker"
        });

        res.status(200).json({
            success: true,
            jobId: job.id,
            message: "Job added successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});