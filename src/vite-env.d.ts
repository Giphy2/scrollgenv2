/// <reference types="vite/client" />
/// <reference types="vite/client" />

declare module '*.jsx' {
  import React from 'react'
  const Component: React.ComponentType
  export default Component
}
