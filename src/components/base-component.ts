// Component Base Class that has shared functionalities which the classes that render something to the DOM have in commom:
export abstract class Component<T extends HTMLElement, U extends HTMLElement> {
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
