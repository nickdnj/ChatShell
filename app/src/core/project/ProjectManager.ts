export interface ProjectHandle {
  rootPath: string;
}

export interface InitResult {
  created: boolean;
  rootPath: string;
}

export interface ProjectSummary {
  rootPath: string;
  lastOpenedAt: string;
}

export class ProjectManager {
  // TODO: manage project lifecycle and .codexcanvas initialization.
  openProject(path: string): ProjectHandle {
    return { rootPath: path };
  }

  initProject(path: string): InitResult {
    return { created: false, rootPath: path };
  }

  getRecentProjects(): ProjectSummary[] {
    return [];
  }
}
