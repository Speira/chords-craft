import { gql } from 'graphql-request';

const PROFILE_FIELDS = `
  userId
  name
  email
  phone
  preferredChannel
  region { country area }
  roles { role detail isPrimary level }
  styles { style detail }
  version
  createdAt
  updatedAt
`;

const UNAVAILABILITY_FIELDS = `
  id
  from
  to
  reason
  appliesToAllBands
  bandIds
`;

export const MY_PROFILE = gql`
  query MyProfile {
    myProfile { ${PROFILE_FIELDS} }
  }
`;

export const SAVE_MY_PROFILE = gql`
  mutation SaveMyProfile($input: SaveProfileInput!) {
    saveMyProfile(input: $input) { ${PROFILE_FIELDS} }
  }
`;

export const MY_UNAVAILABILITY = gql`
  query MyUnavailability($from: AWSDate!, $to: AWSDate!) {
    myUnavailability(from: $from, to: $to) { ${UNAVAILABILITY_FIELDS} }
  }
`;

export const ADD_UNAVAILABILITY = gql`
  mutation AddUnavailability($input: UnavailabilityInput!) {
    addUnavailability(input: $input) { ${UNAVAILABILITY_FIELDS} }
  }
`;

export const REMOVE_UNAVAILABILITY = gql`
  mutation RemoveUnavailability($id: ID!) {
    removeUnavailability(id: $id)
  }
`;
