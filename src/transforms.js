export const athleteToUser = (athlete) => ({
  id: athlete.id,
  firstName: athlete.firstname,
  lastName: athlete.lastname,
  fullName: `${athlete.firstname} ${athlete.lastname}`,
  email: athlete.email,
  username: athlete.username,
  profilePicture: athlete.profile.startsWith('http') ? athlete.profile : null
})
