export interface Resource {
  name: string;
  uri: string;
  location: {
    og: string;
    [key: string]: string;
  };
}