// Drag and drop interfaces:

interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

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
    this.updateListeners();
  }

  // Switch the status of a project:
  moveProject(projectID: string, newStatus: ProjectStatus) {
    const project = this.projects.find((proj) => proj.id === projectID);
    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners();
    }
  }

  // All the time something changes, like adding a new project, we call all the listeners functions:
  private updateListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
      // Now every listener function is getting executed and gets a copy of the projects
    }
  }
}

// global instance which I can use from the entire file:
const projectState = ProjectState.getInstance();

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

function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
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

    this.attach(insertAtStart);
  }

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

// Render project item
class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
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

  @autobind
  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData("text/plain", this.project.id);
    event.dataTransfer!.effectAllowed = "move";
  }

  dragEndHandler(_: DragEvent) {
    console.log("DragEnd");
  }

  // Listen to the dragStart Event:
  configure() {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }
  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + " assigned";
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

// Reachout the template and render list of projects
class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedProjects: Project[];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  // Drop area:
  @autobind
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }
  @autobind
  dropHandler(event: DragEvent) {
    const projID = event.dataTransfer!.getData("text/plain");
    // change the project status:
    projectState.moveProject(
      projID,
      this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished
    );
  }
  @autobind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  configure() {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler);
    // Register a listener function:
    projectState.addListener((projects: Project[]) => {
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

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList("active");
const finishedProjectList = new ProjectList("finished");
// const projectItem = new ProjectItem();

// Get access to the form input, like reading the values when the form gets submited and set up the event listener to the button

document.createElement("li");
