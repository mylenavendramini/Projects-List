enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    // status of the project: active or finished (enum)
    public status: ProjectStatus
  ) {}
}

type Listener<T> = (items: T[]) => void;

class State<T> {
  // listeners: functions that should be called whenever something changes (e.g addProject):
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

// Create a class that manages the state of the application and allow me to setup listeners in different parts of the application. I only want to have one instance of this class (getInstance())
// Project State management:

class ProjectState extends State<Project> {
  // to the projects don't have the type any[], I create a new Project Class for that
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, people: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      people,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    // All the time something changes, like adding a new project, we call all the listeners functions:
    for (const listenerFn of this.listeners) {
      // slice() = create a new copy of the array
      listenerFn(this.projects.slice());
      // Now every listener function is getting executed and gets a copy of the projects
    }
  }
}

// global instance which I can use from the entire file:
const projectState = ProjectState.getInstance();
// With the projectState, I call addProject() in the ProjectInput (when click the button) and pass the update list of projects to ProjectList whenever it changes (projectState.addListener)

interface Validatable {
  value: string | number;
  required?: boolean;
  // length of the string:
  minLength?: number;
  maxLength?: number;
  // value is below or above a certain number:
  min?: number;
  max?: number;
}
function validate(validatableInput: Validatable) {
  let isValid = true;
  // check if the obj is required - if it is (true), it means a value is not empty
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
}

function Autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const value = descriptor.value;
  const adjustedDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      const bindFn = value.bind(this);
      return bindFn;
    },
  };
  return adjustedDescriptor;
}

// Component Base Class that has shared functionalities which the classes that render something to the DOM have in commom:
// Because hostElement can be HTMLDivElement or anything else and element can be HTMLElement in one class, HTMLFormElement in another one, for example, we can set generic types where when we inherit from it, we can set the concrete types.
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateEl: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateID: string,
    hostElementID: string,
    insertAtStart: boolean,
    newElementID?: string
  ) {
    this.templateEl = document.getElementById(
      templateID
    )! as HTMLTemplateElement;

    this.hostElement = document.getElementById(hostElementID)! as T;

    const importedNode = document.importNode(this.templateEl.content, true); // this is a document fragment, we need to get access to the concrete HTML element in there:
    this.element = importedNode.firstElementChild as U;

    if (newElementID) {
      this.element.id = newElementID;
    }
    // this.configure();
    // this.renderContent()

    this.attach(insertAtStart);
  }

  //   private attach() {
  //   this.divEl.insertAdjacentElement("beforeend", this.sectionEl);
  // }
  private attach(insertAt: boolean) {
    this.hostElement.insertAdjacentElement(
      // "beforeend": false; "afterbegin": true
      insertAt ? "afterbegin" : "beforeend",

      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

// Reachout the template and render list of projects
class ProjectList extends Component<HTMLDivElement, HTMLElement> {
  assignedProjects: Project[];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  // This configure() wasn't here before, we had to add because the Component Class ask to have in any extended class. So, I could get my addListener that was inside the constructior and put inside the configure function:
  configure() {
    // Register a listener function:
    projectState.addListener((projects: Project[]) => {
      // We know that this function gets a list of projects because thats what we stablished in the ProjectState (const listenerFn of this.listeners)
      // Before store the projects, I want to filter them:
      const relevantProjects = projects.filter((proj) => {
        if (this.type === "active") {
          return proj.status === ProjectStatus.Active;
        }
        return proj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      // I get the projects because something changed and I'm rewriting the assignedProjects with this list of projects and them I can render all this projects
      this.renderProjects();
    });
  }

  renderContent() {
    const listID = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listID;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }

  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;

    listEl.innerHTML = "";
    for (const projItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector("ul")!.id, projItem);
    }
  }
}

// Render project item

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> {
  // We want to store the project that belongs to the rendered project item (based on the ProjectClass) in the ProjectItemClass:
  private project: Project;

  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} people`;
    }
  }

  constructor(hostID: string, project: Project) {
    super("single-project", hostID, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }
  configure(): void {}
  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + " assigned";
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

// Passing the gatherUserInput() to the project list and add new item to it

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
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

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
      maxLength: 20,
    };
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };
    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 10,
    };

    // validate:
    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
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

  @Autobind
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
    // do something with the input values
  }
}

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList("active");
const finishedProjectList = new ProjectList("finished");
// const projectItem = new ProjectItem();

// Get access to the form input, like reading the values when the form gets submited and set up the event listener to the button

document.createElement("li");
