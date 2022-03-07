import { User } from "../../generated/schema";

export function loadUser(id: string): User {
  let user = User.load(id);
  if (!user) {
    user = new User(id);
    user.save();
  }
  return user;
}
