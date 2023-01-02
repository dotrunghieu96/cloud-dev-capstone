import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoComment } from '../models/TodoComment'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodoCommentAccess')

export class TodoCommentAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todoCommentsTable = process.env.TODOS_COMMENT_TABLE,
        private readonly createdAtIndex = process.env.TODOS_CREATED_AT_INDEX
    ) { }

    async addComment(newComment: TodoComment): Promise<TodoComment> {
        logger.info(`Create new comment on: ${newComment.todoId}`);
        await this.docClient
            .put({
                TableName: this.todoCommentsTable,
                Item: newComment
            })
            .promise();
        return newComment;
    }

    async getComments(todoId: string) {
        logger.info(`Getting all comments for todo item: ${todoId}`);
        const result = await this.docClient
            .query({
                TableName: this.todoCommentsTable,
                IndexName: this.createdAtIndex,
                KeyConditionExpression: 'todoId = :todoId AND createdAt < :time',
                ExpressionAttributeValues: {
                    ':todoId': todoId,
                    ':time': new Date().toISOString()
                },
                ScanIndexForward: false
            })
            .promise();
        return result.Items as TodoComment[];
    }
}