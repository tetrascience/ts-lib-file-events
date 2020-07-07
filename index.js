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
    publishS3Event(status, event) {
        const bucket = event.s3.bucket.name;
        const key = decodeURIComponent(event.s3.object.key.replace(/\+/g, ' '));
        const version = event.s3.object.versionId;
        return this.publish(status, bucket, key, version);
    }
    async publish(status, bucket, key, version) {
        if (!FILE_EVENT_QUEUE_URL) {
            this.logger({
                message: 'File Event Publisher missing FILE_EVENT_QUEUE_URL env var, cannot publish file event',
                level: 'DEBUG',
                status,
                bucket,
                key,
                version,
            });
            return;
        }
        const event = {
            component: this.component,
            status,
            bucket,
            key,
            version,
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
                bucket,
                key,
                version,
                reason: err.message,
            });
        }
    }
}
exports.FileEventPublisher = FileEventPublisher;
exports.default = FileEventPublisher;
