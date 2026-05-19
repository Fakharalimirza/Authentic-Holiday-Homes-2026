# Authentic Holiday Homes Security Specification

## Data Invariants
1. A booking cannot exist without a valid property ID and a valid user ID.
2. A property can only be edited by its host.
3. Reviews are immutable once posted (only owner can delete, maybe).
4. Chat messages are only readable by the sender and receiver.
5. Users cannot elevate their own roles to 'admin'.

## The "Dirty Dozen" Payloads
1. Create property with `hostId` of another user.
2. Update property `pricePerNight` to $1 as a non-host.
3. Book a property that is already booked (state transition check).
4. Read private chat messages between two other users.
5. Search for users and get their private PII (email).
6. Create a review for a property the user never stayed at (relational validation).
7. Delete a booking as a different user.
8. Inject a 1MB string into a property description (resource poisoning).
9. Change the `createdAt` timestamp of a booking.
10. Set `role: 'admin'` during user profile creation.
11. Update `amount` field in a completed booking.
12. Create a booking with a junk character string as ID.

## The Test Runner
(I will implement `firestore.rules` first and then test patterns).
