"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileEventPublisher = void 0;
const aws_sdk_1 = require("aws-sdk");
const sqs = new aws_sdk_1.SQS({ apiVersion: '2012-11-05' });
const { FILE_EVENT_QUEUE_URL } = process.env;
function defaultLogger(obj) { }
class FileEventPublisher {
    constructor(pckg, logger) {
        if (!pckg || !pckg.name) {
            throw new Error('Must provide package definition');
        }
        this.component = pckg.name;
        this.logger = logger || defaultLogger;
    }
    async publish(status, fileId, contextId) {
        if (!FILE_EVENT_QUEUE_URL) {
            this.logger({
                message: 'File Event Publisher missing FILE_EVENT_QUEUE_URL env var, cannot publish file event',
                level: 'DEBUG',
                status,
                fileId,
            });
            return;
        }
        const event = {
            component: this.component,
            status,
            fileId,
            contextId,
            createdAt: new Date().toISOString(),
        };
        try {
            const params = {
                MessageBody: JSON.stringify(event),
                QueueUrl: FILE_EVENT_QUEUE_URL,
            };
            await sqs
                .sendMessage(params)
                .promise();
        }
        catch (err) {
            this.logger({
                message: 'File Event Publisher failed to publish file event',
                level: 'DEBUG',
                status,
                fileId,
                reason: err.message,
            });
        }
    }
}
exports.FileEventPublisher = FileEventPublisher;
exports.default = FileEventPublisher;
