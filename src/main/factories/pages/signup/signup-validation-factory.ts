import { PasswordRegexValidator } from '@/infra/validation/password-regex-validator'
import { ValidationComposite } from '@/validation/validators/validation-composite/validation-composite'
import { EmailRegexValidator } from '@/infra/validation/email-regex-validator'
import { PasswordRules } from '@/validation/protocols'
import { ValidationBuilder as Builder } from '@/validation/validators/builder/validation-builder'

export const makeSignUpValidation = (): ValidationComposite => {
  const emailRegexValidator = new EmailRegexValidator()
  const rules: PasswordRules = { min: 5, max: 20, symbols: true }
  const passwordRegexValidator = new PasswordRegexValidator(rules)
  const validationComposite = ValidationComposite.build([
    ...Builder.field('name').required().build(),
    ...Builder.field('email').required().email(emailRegexValidator).build(),
    ...Builder.field('password').required().password(passwordRegexValidator).build(),
    ...Builder.field('passwordConfirmation').required().sameAs('password').build()
  ])
  return validationComposite
}
