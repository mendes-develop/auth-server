const users: User[] = []

export const userDTO = {
  findUserByEmail: (email: string) => {
    return users.find(user => user.email === email)
  },
  createUser: async (user: CreteUser) => {
    const newUser: User = {
      ...user,
      id: users.length + 1,
      password_hash: await Bun.password.hash(user.password),
    }

    users.push(newUser)

    return newUser
  },
  verifyPassword: async (password: string, hash: string,) => {
    return await Bun.password.verify(password, hash)
  }
}

type User = {
  id: number,
  email: string,
  password_hash: string,
}

type CreteUser = Omit<User, 'id' | 'password_hash'> & {
  password: string,
}