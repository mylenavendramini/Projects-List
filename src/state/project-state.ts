import { Project, ProjectStatus } from "../models/project.js";

// Project State management:
type Listener<T> = (items: T[]) => void;

class State<T> {
  // listeners: functions that should be called whenever something changes (e.g addProject):
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

export class ProjectState extends State<Project> {
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
export const projectState = ProjectState.getInstance();
