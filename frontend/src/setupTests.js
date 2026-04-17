import '@testing-library/jest-dom';

// Configurar localStorage mock para tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    return undefined;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return undefined;
    }),
    clear: jest.fn(() => {
      store = {};
      return undefined;
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Limpiar mocks después de cada test
afterEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});
