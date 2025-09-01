import { reduce } from "../reduce/mod";
import { select } from "../select/mod";
import { Store } from "../Store";

export type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export type TodoState = {
  todos: readonly Todo[];
  latestError?: Error;
};

export class TodoStore extends Store<Readonly<TodoState>> {
  constructor() {
    super({
      todos: [],
    });
  }

  /**
   * Retrieves a todo by its ID.
   *
   * @param id The ID of the todo to retrieve.
   * @returns The todo with the specified ID, or undefined if not found.
   *
   * @public
   */
  getTodoById(id: number): Todo | undefined {
    return this.accessor.todos.find((todo) => todo.id === id);
  }

  accessor = this.createAccessor({
    todos: this.select.todos,
    latestError: this.select.latestError,
    latestTodo: select(this.select.todos).combine(select.last),
  });

  actions = this.createActions({
    addTodo: reduce.withErrorBranch(
      reduce.toProp("latestError"),
      reduce.toProp("todos", (todos, newTodo: Todo) =>
        reduce.itemAppend(todos, newTodo),
      ),
    ),
    toggleTodo: reduce.toProp("todos", (todos, id: number) =>
      reduce.itemUpdate(
        todos,
        (todo) => todo.id === id,
        (todo) => ({ ...todo, completed: !todo.completed }),
      ),
    ),
    removeTodo: reduce.toProp("todos", (todos, id: number) =>
      reduce.itemRemove(todos, (todo) => todo.id === id),
    ),
    clearError: reduce.toProp(
      "latestError",
      (state, payload: void) => undefined,
    ),
  });
}
