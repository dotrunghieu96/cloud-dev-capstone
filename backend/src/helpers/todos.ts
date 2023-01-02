import { TodosAccess } from './todosAccess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import { TodoCommentAccess } from './commentAccess';
import { AddCommentRequest } from '../requests/AddCommentRequest';
import { TodoComment } from '../models/TodoComment';

const todosAccess = new TodosAccess();
const attachmentUtils = new AttachmentUtils();
const commentAccess = new TodoCommentAccess();

// TODO: Implement businessLogic
export async function createTodo(userId: string, newTodoRequest: CreateTodoRequest) {
    const todoId = uuid.v4();
    const done = false;
    const createdAt = new Date().toISOString();
    const newTodo: TodoItem = { todoId, userId, createdAt, done, ...newTodoRequest };
    return todosAccess.createTodo(newTodo);
}

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    return todosAccess.getTodos(userId);
}

export async function updateTodo(userId: string, todoId: string, updateData: UpdateTodoRequest): Promise<void> {
    return todosAccess.updateTodo(userId, todoId, updateData);
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
    return todosAccess.deleteTodo(userId, todoId);
}

export async function createAttachmentPresignedUrl(userId: string, todoId: string): Promise<string> {
    const s3Bucket = process.env.ATTACHMENT_S3_BUCKET;

    await todosAccess.setAttachmentUrl(userId, todoId, s3Bucket);
    return attachmentUtils.getSignedS3Url(todoId, s3Bucket);
}

export async function addComment(userId:string, todoId: string, request: AddCommentRequest) {
    //Validate todoId
    const todoItem: TodoItem = await todosAccess.getTodoById(userId, todoId)
    if (!todoItem) {
        throw new Error("todoId is not valid");
    }
    const commentId = uuid.v4();
    const createdAt = new Date().toISOString();
    const newComment: TodoComment = { todoId, commentId, createdAt, ...request };
    return commentAccess.addComment(newComment);
}

export async function getCommentsForTodo(todoId: string) {
    return commentAccess.getComments(todoId);
}