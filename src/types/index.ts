export interface Location {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  }
  
  export interface SavedLocation extends Location {
    id: string;
    name: string;
    description: string;
    type: string;
  }
  
  export interface LocationDetail {
    title: string;
    desription: string; // Note: keeping original typo for API compatibility
    pinColor: string;
  }
  
  export interface LocationFormData {
    name: string;
    description: string;
    type: string;
    latitude: number;
    longitude: number;
  }
  export interface ExtendedUserInfo {
    access_token?: string;
    refresh_token?: string;
    number_of_children?: number;
    children?: number[];
    isAdmin?: boolean;
    name?: string;
    email?: string;
    user?: {
      name?: string;
      email?: string;
    };
    [key: string]: any; // Allow for additional properties
  }
  