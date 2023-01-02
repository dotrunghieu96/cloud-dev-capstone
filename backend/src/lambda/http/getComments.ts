import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getCommentsForTodo } from '../../helpers/todos'
import { createLogger } from '../../utils/logger'
import { TodoComment } from '../../models/TodoComment'

const logger = createLogger('getTodos')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;

    try {
      const comments: TodoComment[] = await getCommentsForTodo(todoId);
      logger.info('TodoList retrieved');
      return {
        statusCode: 200,
        body: JSON.stringify({ comments })
      };
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      throw error;
    }
  })

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
