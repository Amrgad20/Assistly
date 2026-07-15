export type AttachmentType =
  | 'image'
  | 'voice'
  | 'file';

export interface Attachment {

  id: string;

  type: AttachmentType;

  url: string;

  name: string;

}