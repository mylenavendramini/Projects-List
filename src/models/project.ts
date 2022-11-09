export enum ProjectStatus {
  Active,
  Finished,
}

export class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    // status of the project: active or finished (enum)
    public status: ProjectStatus
  ) {}
}
