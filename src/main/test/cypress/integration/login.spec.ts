import faker from 'faker'

const baseUrl: string = Cypress.config().baseUrl

describe('Login', () => {
  beforeEach(() => {
    cy.server()
    cy.visit('login')
  })

  it('should load with correct initial state', () => {
    cy.getByTestId('email-status')
      .should('have.attr', 'title', 'Campo obrigatório')
      .should('contain.text', '✗')
    cy.getByTestId('password-status')
      .should('have.attr', 'title', 'Campo obrigatório')
      .should('contain.text', '✗')
    cy.getByTestId('submit')
      .should('contain.text', 'Entrar')
      .should('have.attr', 'disabled')
    cy.getByTestId('error-wrap').should('not.have.descendants')
    cy.getByTestId('toSignup')
      .should('contain.text', 'Criar conta')
      .should('have.attr', 'href', '/signup')
  })

  it('should present error state if form is invalid', () => {
    cy.getByTestId('email').type(faker.random.word())
    cy.getByTestId('email-status')
      .should('have.attr', 'title', 'Campo email inválido')
      .should('contain.text', '✗')
    cy.getByTestId('password').type(faker.random.alphaNumeric(3))
    cy.getByTestId('password-status')
      .should('have.attr', 'title', 'Campo password inválido')
      .should('contain.text', '✗')
    cy.getByTestId('submit')
      .should('have.attr', 'disabled')
    cy.getByTestId('error-wrap').should('not.have.descendants')
  })

  it('should present error state if only email field is valid', () => {
    cy.getByTestId('email').type(faker.internet.email())
    cy.getByTestId('email-status')
      .should('have.attr', 'title', 'Campo preenchido corretamente')
      .should('contain.text', '✓')
    cy.getByTestId('password').type(faker.random.alphaNumeric(3))
    cy.getByTestId('password-status')
      .should('have.attr', 'title', 'Campo password inválido')
      .should('contain.text', '✗')
    cy.getByTestId('submit')
      .should('have.attr', 'disabled')
    cy.getByTestId('error-wrap').should('not.have.descendants')
  })

  it('should present error state if only password field is valid', () => {
    cy.getByTestId('email').type(faker.random.word())
    cy.getByTestId('email-status')
      .should('have.attr', 'title', 'Campo email inválido')
      .should('contain.text', '✗')
    cy.getByTestId('password').type(faker.internet.password(10, false, '', '@2Aa'))
    cy.getByTestId('password-status')
      .should('have.attr', 'title', 'Campo preenchido corretamente')
      .should('contain.text', '✓')
    cy.getByTestId('submit')
      .should('have.attr', 'disabled')
    cy.getByTestId('error-wrap').should('not.have.descendants')
  })

  it('should present valid state if form is valid', () => {
    cy.getByTestId('email').type(faker.internet.email())
    cy.getByTestId('email-status')
      .should('have.attr', 'title', 'Campo preenchido corretamente')
      .should('contain.text', '✓')
    cy.getByTestId('password').type(faker.internet.password(10, false, '', '@2Aa'))
    cy.getByTestId('password-status')
      .should('have.attr', 'title', 'Campo preenchido corretamente')
      .should('contain.text', '✓')
    cy.getByTestId('submit')
      .should('not.have.attr', 'disabled')
    cy.getByTestId('error-wrap').should('not.have.descendants')
  })

  it('should present spinner pending the request', () => {
    cy.getByTestId('email').type(faker.internet.email())
    cy.getByTestId('password').type(faker.internet.password(10, false, '', '@2Aa'))
    cy.getByTestId('submit').click()
      .getByTestId('spinner').should('exist')
      .getByTestId('main-error').should('not.exist')
  })

  it('should present UnexpectedError on 400', () => {
    cy.route({
      method: 'POST',
      url: /login/,
      status: 400,
      response: {
        erro: faker.random.words()
      }
    })
    cy.getByTestId('email').type(faker.internet.email())
    cy.getByTestId('password').type(faker.internet.password(10, false, '', '@2Aa'))
    cy.getByTestId('submit').click()
    cy.getByTestId('spinner').should('not.exist')
      .getByTestId('main-error').should('contain.text', 'Algum erro ocorreu. Verifique sua conexão e tente novamente.')
    cy.url().should('eq', `${baseUrl}/login`)
  })

  it('should presentInvalidCredentialsError on 401', () => {
    cy.route({
      method: 'POST',
      url: /login/,
      status: 401,
      response: {
        erro: faker.random.words()
      }
    })
    cy.getByTestId('email').type(faker.internet.email())
    cy.getByTestId('password').type(faker.internet.password(10, false, '', '@2Aa'))
    cy.getByTestId('submit').click()
    cy.getByTestId('spinner').should('not.exist')
      .getByTestId('main-error').should('contain.text', 'Credenciais Inválidas')
    cy.url().should('eq', `${baseUrl}/login`)
  })

  it('should present UnexpectedError if invalid data is returned', () => {
    cy.route({
      method: 'POST',
      url: /login/,
      status: 200,
      response: {
        invalidProperty: faker.random.uuid()
      }
    })
    cy.getByTestId('email').type('any_email@mail.com')
    cy.getByTestId('password').type('any_password')
    cy.getByTestId('submit').click()
    cy.getByTestId('error-wrap').should('not.have.descendants')
    cy.getByTestId('main-error').should('contain.text', 'Algum erro ocorreu. Verifique sua conexão e tente novamente.')
  })

  it('should save accessToken if valid credentials are provided', () => {
    cy.route({
      method: 'POST',
      url: /login/,
      status: 200,
      response: {
        accessToken: faker.random.uuid()
      }
    })
    cy.getByTestId('email').type('any_email@mail.com')
    cy.getByTestId('password').type('any_password')
    cy.getByTestId('submit').click()
    cy.getByTestId('error-wrap').should('not.have.descendants')
    cy.url().should('eq', `${baseUrl}/`)
    cy.window().then(window => assert.isOk(window.localStorage.getItem('accessToken')))
  })
})
