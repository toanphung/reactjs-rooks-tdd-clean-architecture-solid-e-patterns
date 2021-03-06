import React from 'react'
import { Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'
import faker from 'faker'
import { SignUp } from '@/presentation/pages'
import { render, RenderResult, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { Helper, stubValidation, fakeSignUpSubmit, stubAddAccount, stubSaveAccessToken } from '@/presentation/test'
import { Validation } from '@/presentation/protocols/validation'
import { AddAccount, SaveAccessToken } from '@/domain/usecases'
import { EmailInUseError } from '@/domain/errors'

type SutTypes = {
  sut: RenderResult
  validationStub: Validation
  addAccountStub: AddAccount
  saveAccessTokenStub: SaveAccessToken
}

const history = createMemoryHistory({ initialEntries: ['/signup'] })
const makeSut = (): SutTypes => {
  const addAccountStub = stubAddAccount()
  const validationStub = stubValidation()
  const saveAccessTokenStub = stubSaveAccessToken()
  const sut = render(
    <Router history={history}>
      <SignUp
        validation={validationStub}
        addAccount={addAccountStub}
        saveAccessToken={saveAccessTokenStub}
      />
    </Router>
  )
  return {
    sut,
    validationStub,
    addAccountStub,
    saveAccessTokenStub
  }
}

describe('SignUp Component', () => {
  afterEach(cleanup)
  const fields = ['name', 'email', 'password', 'passwordConfirmation']

  describe('Initial State', () => {
    it('should not render spinner and error on start', () => {
      const { sut } = makeSut()
      Helper.testElementExist(sut, 'error-wrap')
      Helper.testChildCount(sut, 'error-wrap', 0)
    })

    it('should submit button disabled', () => {
      const { sut } = makeSut()
      Helper.testButtonIsDisabled(sut, 'submit', true)
    })

    it('should input name is required', () => {
      const { sut } = makeSut()
      const errorMessage = 'Campo obrigatório'
      Helper.testStatusFieldFails(sut, 'name', errorMessage)
    })

    it('should input email is required', () => {
      const { sut } = makeSut()
      const errorMessage = 'Campo obrigatório'
      Helper.testStatusFieldFails(sut, 'email', errorMessage)
    })

    it('should input password is required', () => {
      const { sut } = makeSut()
      const errorMessage = 'Campo obrigatório'
      Helper.testStatusFieldFails(sut, 'password', errorMessage)
    })

    it('should input passwordConfirmation is required', () => {
      const { sut } = makeSut()
      const errorMessage = 'Campo obrigatório'
      Helper.testStatusFieldFails(sut, 'passwordConfirmation', errorMessage)
    })
  })

  describe('Fields Validation', () => {
    it('should call Validation with correct fields', () => {
      const { sut, validationStub } = makeSut()
      const validateSpy = jest.spyOn(validationStub, 'validate')
      Helper.fakerField(sut, 'name')
      Helper.fakerField(sut, 'email')
      Helper.fakerField(sut, 'password')
      Helper.fakerField(sut, 'passwordConfirmation')
      expect(validateSpy).toBeCalledTimes(4)
    })

    it('should show message field error if Validation fails', () => {
      const { sut, validationStub } = makeSut()
      const errorMessage = faker.random.words()
      jest.spyOn(validationStub, 'validate').mockReturnValue(errorMessage)
      for (const field of fields) {
        Helper.fakerField(sut, field)
        Helper.testStatusFieldFails(sut, field, errorMessage)
      }
    })

    it('should show valid field state if Validation succeeds', () => {
      const { sut } = makeSut()
      for (const field of fields) {
        Helper.fakerField(sut, field)
        Helper.testStatusFieldSuccess(sut, field)
      }
    })

    it('should enable button if form is valid', () => {
      const { sut } = makeSut()
      fakeSignUpSubmit(sut)
      Helper.testButtonIsDisabled(sut, 'submit', false)
    })
  })

  describe('AddAccount', () => {
    it('should show spinner on submit', () => {
      const { sut } = makeSut()
      fakeSignUpSubmit(sut)
      Helper.testElementExist(sut, 'spinner')
    })

    it('should call AddAccount with correct values', () => {
      const { sut, addAccountStub } = makeSut()
      const addSpy = jest.spyOn(addAccountStub, 'add')
      const { name, email, password, passwordConfirmation } = fakeSignUpSubmit(sut)
      expect(addSpy).toBeCalledWith({
        name,
        email,
        password,
        passwordConfirmation
      })
    })

    it('should call AddAccount only once', () => {
      const { sut, addAccountStub } = makeSut()
      const addSpy = jest.spyOn(addAccountStub, 'add')
      fakeSignUpSubmit(sut)
      fakeSignUpSubmit(sut)
      expect(addSpy).toBeCalledTimes(1)
    })

    it('should not call AddAccount if form is invalid', () => {
      const { sut, addAccountStub } = makeSut()
      const addSpy = jest.spyOn(addAccountStub, 'add')
      fireEvent.submit(sut.getByTestId('form'))
      expect(addSpy).toBeCalledTimes(0)
    })

    it('should present error if AddAccount fails', async () => {
      const { sut, addAccountStub } = makeSut()
      const error = new EmailInUseError()
      jest.spyOn(addAccountStub, 'add').mockRejectedValueOnce(error)
      fakeSignUpSubmit(sut)
      await Helper.testWaitTextContent(sut, 'error-wrap', 'main-error', error.message)
      Helper.testChildCount(sut, 'error-wrap', 1)
    })

    it('should call SaveAccessToken on success', async () => {
      const { sut, saveAccessTokenStub } = makeSut()
      const saveSpy = jest.spyOn(saveAccessTokenStub, 'save')
      fakeSignUpSubmit(sut)
      await waitFor(() => sut.getByTestId('form'))
      expect(saveSpy).toBeCalledTimes(1)
    })

    it('should present error if SaveAccessToken fails', async () => {
      const { sut, saveAccessTokenStub } = makeSut()
      const error = new Error('any_error')
      jest.spyOn(saveAccessTokenStub, 'save').mockRejectedValueOnce(error)
      fakeSignUpSubmit(sut)
      await Helper.testWaitTextContent(sut, 'error-wrap', 'main-error', error.message)
      Helper.testChildCount(sut, 'error-wrap', 1)
    })

    it('should go to main page on success', () => {
      const { sut } = makeSut()
      fakeSignUpSubmit(sut)
      expect(history.length).toBe(1)
      expect(history.location.pathname).toBe('/')
    })
  })

  it('should back to login page', () => {
    const { sut } = makeSut()
    const toLogin = sut.getByTestId('toLogin')
    fireEvent.click(toLogin)
    expect(history.length).toBe(1)
    expect(history.location.pathname).toBe('/login')
  })
})
