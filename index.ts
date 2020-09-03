import { SQS } from 'aws-sdk';
import { S3EventRecord } from 'aws-lambda/trigger/s3';

const sqs = new SQS({ apiVersion: '2012-11-05' });
const { FILE_EVENT_QUEUE_URL } = process.env;

export interface PackageInfo {
  name: string;
}

export interface Logger {
  (obj: LogMessage): void
}

export interface LogMessage {
  message: string;
  level: string;
  status?: string;
  fileId?: string;
  reason?: string;
}

export interface EventPublisher {
  component: string;
  logger: Logger;
  publish(status: string, fileId: string, contextId?: string): Promise<void>;
}

function defaultLogger(obj: LogMessage): void {}

export class FileEventPublisher implements EventPublisher {
  component: string;
  logger: Logger;

  constructor(pckg: PackageInfo, logger: Logger) {
    if (!pckg || !pckg.name) {
      throw new Error('Must provide package definition');
    }

    this.component = pckg.name;
    this.logger = logger || defaultLogger;
  }

  async publish(status: string, fileId: string, contextId?: string): Promise<void> {
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

    } catch (err) {
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

export default FileEventPublisher;