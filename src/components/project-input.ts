import Component from "./base-component";
import * as Validation from "../util/validation";
import { autobind } from "../decorators/autobind";
import { projectState } from "../state/project-state";

export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInput!: HTMLInputElement;
  descriptionInput!: HTMLInputElement;
  peopleInput!: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");
    // this.element.id = "user-input";

    const titleInput = this.element.querySelector("#title") as HTMLInputElement;
    if (titleInput) {
      this.titleInput = titleInput;
    }
    const descriptionInput = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    if (descriptionInput) {
      this.descriptionInput = descriptionInput;
    }
    const peopleInput = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;
    if (peopleInput) {
      this.peopleInput = peopleInput;
    }

    this.configure();
    this.renderContent();
  }

  configure() {
    // setup the eventListener, triggering whenever the form is submited in the submitHandler
    this.element.addEventListener("submit", this.submitHandler);
  }

  renderContent(): void {}

  // this method has a tuple type:
  private gatherUserInput(): [string, string, number] | void {
    // store the value of the inputs:
    const enteredTitle = this.titleInput.value;
    const enteredDescription = this.descriptionInput.value;
    const enteredPeople = this.peopleInput.value;

    const titleValidatable: Validation.Validatable = {
      value: enteredTitle,
      required: true,
      maxLength: 20,
    };
    const descriptionValidatable: Validation.Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };
    const peopleValidatable: Validation.Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 10,
    };

    // validate:
    if (
      !Validation.validate(titleValidatable) ||
      !Validation.validate(descriptionValidatable) ||
      !Validation.validate(peopleValidatable)
    ) {
      alert("Invalid input! Please try again!");
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  // clear the input fields after click the submit button:
  private clearInputs() {
    this.titleInput.value = "";
    this.descriptionInput.value = "";
    this.peopleInput.value = "";
  }

  @autobind
  private submitHandler(e: Event) {
    e.preventDefault();
    // reach out all the inputs, gather the user input there, validate it and return it
    const userInput = this.gatherUserInput();
    // check if userInput is a tuple:
    if (Array.isArray(userInput)) {
      // take the inputs out of userInput
      const [title, desc, people] = userInput;
      console.log(title, desc, people);
      projectState.addProject(title, desc, people);
      // this.renderProject();

      this.clearInputs();
    }
  }
}
