import '@testing-library/jest-dom'

// Mock de fetch global para las pruebas
global.fetch = jest.fn()

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock de window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// Mock de console para evitar logs durante las pruebas
const originalConsole = console
beforeAll(() => {
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})

// Limpiar mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})