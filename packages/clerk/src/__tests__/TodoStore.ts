import { select } from "../select";
import { Store } from "../Store";
import {
  appendElement,
  reduceOnError,
  reduceToProperty,
  reduceToPropertyValue,
  removeElement,
  selectLastELement,
  updateElement,
} from "../utils/mod";

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
    return this.get().todos.find((todo) => todo.id === id);
  }

  createSelectors<T>(creator: (store: this) => T): T {
    return creator(this);
  }

  selectTodos = this.propertySelector("todos");
  selectLatestError = this.propertySelector("latestError");
  selectLatestTodo = select(this.selectTodos).combine(selectLastELement);

  todos$ = this.ref(this.selectTodos);
  errors$ = this.ref(this.selectLatestError);
  latestTodo$ = this.ref(this.selectLatestTodo);

  get todos() {
    return this.selectTodos(this.value);
  }
  get errors() {
    return this.selectLatestError(this.value);
  }
  get latestTodo() {
    return this.selectLatestTodo(this.value);
  }

  actions = this.createActions({
    addTodo: reduceOnError(
      reduceToProperty("latestError"),
      reduceToProperty("todos", (todos, newTodo: Todo) =>
        appendElement(todos, newTodo),
      ),
    ),

    toggleTodo: reduceToProperty("todos", (todos, id: number) =>
      updateElement(
        todos,
        (todo) => todo.id === id,
        (todo) => ({ ...todo, completed: !todo.completed }),
      ),
    ),

    removeTodo: reduceToProperty("todos", (todos, id: number) =>
      removeElement(todos, (todo) => todo.id === id),
    ),

    clearError: reduceToPropertyValue("latestError", () => undefined),
  });
}
