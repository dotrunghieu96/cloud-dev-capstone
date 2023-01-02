import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Comment,
  Form
} from 'semantic-ui-react'

import { addComments, createTodo, deleteTodo, getComments, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'
import { TodoComment } from '../types/TodoComment'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  showComments: number
  commentItems: TodoComment[]
  commentContent: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    showComments: -1,
    commentItems: [],
    commentContent: ''
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }
    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderPostComment(todo: Todo) {
    return (
      <Grid.Column width={16}>
        <Divider />
        <Form comment>
          <Form.TextArea
            value={this.state.commentContent}
            onChange={(event) => this.setState({ commentContent: event.target.value })}
          />
          <Button
            floated='right'
            content='Add Comment'
            labelPosition='left'
            icon='send'
            primary
            onClick={() => this.onAddComment(todo.todoId)}
          />
        </Form>
      </Grid.Column>)
  }

  renderComments(): any {
    console.log("rendering comments: " + this.state.commentItems.length);
    let commentBlock: JSX.Element[] = [];
    this.state.commentItems.forEach((commentItem) => {
      commentBlock.push(
        <Comment>
          <Comment.Avatar as='a' src='https://react.semantic-ui.com/images/avatar/small/joe.jpg' />
          <Comment.Content>
            <Comment.Author as='a'>You</Comment.Author>
            <Comment.Metadata>
              <span>{commentItem.createdAt}</span>
            </Comment.Metadata>
            <Comment.Text>
              {commentItem.comment}
            </Comment.Text>
          </Comment.Content>
        </Comment>
      )
    })
    return (
      <Comment.Group threaded>
        {commentBlock}
      </Comment.Group>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          let comment = null;
          let postComment = null;
          if (this.state.showComments === pos) {
            postComment = this.renderPostComment(todo);
            comment = this.renderComments();
          }
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={2} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="green"
                  onClick={() => this.onCommentButtonClick(todo.todoId, pos)}
                >
                  <Icon name="comments outline" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )}
              {postComment}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
              <Grid.Column width={1}>
              </Grid.Column>
              {comment}
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  async onAddComment(todoId: string): Promise<void> {
    console.log('add comment for todo:' + todoId);
    console.log('comment:' + this.state.commentContent);
    const new_comment: TodoComment = await addComments(
      this.props.auth.getIdToken(),
      todoId,
      this.state.commentContent
    );
    const commentItems = this.addFirst(this.state.commentItems, new_comment);
    this.setState({ commentItems: commentItems });
    this.setState({ commentContent: '' });
    console.log(this.state.commentItems);
  }

  addFirst(array: any[], item: any) {
    return [
      item,
      ...array.slice(0)
    ]
  }

  async onCommentButtonClick(todoId: string, position: number): Promise<void> {
    console.log("show comments");
    if (this.state.showComments === position) {
      this.setState({ showComments: -1 });
      this.setState({ commentItems: [] });
      this.setState({ commentContent: '' });
    } else {
      const commentItems = await getComments(this.props.auth.getIdToken(), todoId);
      console.log(commentItems)
      this.setState({ commentItems: commentItems });
      this.setState({ showComments: position });
    }
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
