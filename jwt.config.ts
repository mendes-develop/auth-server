import { jwt } from '@elysiajs/jwt'


export const jwtConfig = jwt({
  name: 'jwt_auth',
  secret: 'Super Safe Secret That Should Be In .ENV',
})
