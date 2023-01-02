import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { addComment } from '../../helpers/todos'
import { createLogger } from '../../utils/logger'
import { TodoComment } from '../../models/TodoComment'
import { AddCommentRequest } from '../../requests/AddCommentRequest'
import { getUserId } from '../utils'

const logger = createLogger('createTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId: string = getUserId(event);
    const todoId = event.pathParameters.todoId;
    const newCommentRequest: AddCommentRequest = JSON.parse(event.body);
    try {
      const newComment: TodoComment = await addComment(userId, todoId, newCommentRequest);
      logger.info('Successfully created a new todo item.');
      return {
        statusCode: 201,
        body: JSON.stringify({ newComment })
      };
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      throw error;
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
