import { Entity } from '@toeverything/infra';

export interface SidebarTabOptions {
  scrollable?: boolean;
}

export class SidebarTab extends Entity<{ id: string } & SidebarTabOptions> {
  readonly id = this.props.id;
  readonly scrollable = this.props.scrollable ?? false;
}
