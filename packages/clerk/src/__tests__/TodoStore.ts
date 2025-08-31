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
    todos: this.selectors.todos,
    latestError: this.selectors.latestError,
    latestTodo: select(this.selectors.todos).combine(select.lastELement),
  });

  actions = this.createActions({
    addTodo: reduce.createErrorBranch(
      reduce.createPropTransform("latestError"),
      reduce.createPropTransform("todos", (todos, newTodo: Todo) =>
        reduce.elementAppend(todos, newTodo),
      ),
    ),
    toggleTodo: reduce.createPropTransform("todos", (todos, id: number) =>
      reduce.elementUpdate(
        todos,
        (todo) => todo.id === id,
        (todo) => ({ ...todo, completed: !todo.completed }),
      ),
    ),
    removeTodo: reduce.createPropTransform("todos", (todos, id: number) =>
      reduce.elementRemove(todos, (todo) => todo.id === id),
    ),
    clearError: reduce.createPropReplace("latestError", () => undefined),
  });
}
