/**
 * @swagger
 * tags:
 *   - name: user
 *     description: Operations related to regular users
 *   - name: admin
 *     description: Operations related to admin users
 * 
 * components:
 *   securitySchemes:
 *     BearerUserAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *     BearerAdminAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 * 
 *     RentalDetails:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         phonenumber:
 *           type: string
 *         rentalDate:
 *           type: string
 *         ICnumber:
 *           type: string
 *         email:
 *           type: string
 * 
 *     CarDetails:
 *       type: object
 *       properties:
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *         year:
 *           type: string
 *         colour:
 *           type: string
 *         noplate:
 *           type: string
 * 
 * /register-User:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             example:
 *               message: Registration successful!
 *               user:
 *                 username: exampleUser
 *                 name: John Doe
 *                 email: john@example.com
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               errors:
 *                 - param: username
 *                   msg: 'Invalid value'
 *                 - param: password
 *                   msg: 'Password must be at least 8 characters'
 *                 - param: email
 *                   msg: 'Invalid email address'
 * 
 * /login-user:
 *   post:
 *     summary: Log in as a user
 *     tags:
 *       - user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               userToken: <user_token>
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: 'Invalid credentials'
 * 
 * /rent-car:
 *   post:
 *     summary: Rent a car
 *     tags:
 *       - user
 *     security:
 *       - BearerUserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RentalDetails'
 *     responses:
 *       201:
 *         description: Car Rental created successfully
 *       500:
 *         description: Error creating rental
 * 
 * /delete-rent-car/{rentalDate}:
 *   delete:
 *     summary: Delete car rental entry by date for a user
 *     tags:
 *       - user
 *     security:
 *       - BearerUserAuth: []
 *     parameters:
 *       - in: path
 *         name: rentalDate
 *         schema:
 *           type: string
 *         required: true
 *         description: Rental date
 *     responses:
 *       200:
 *         description: Car rental entry deleted successfully
 *       404:
 *         description: Car rental entry not found
 *       500:
 *         description: Error deleting car rental entry
 * 
 * /login-admin:
 *   post:
 *     summary: Log in as an admin
 *     tags:
 *       - admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               privateKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             example:
 *               adminToken: <admin_token>
 *               message: Admin login successful
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: 'Unauthorized'
 * 
 * /admin-view-data:
 *   get:
 *     summary: View all data as an admin
 *     tags:
 *       - admin
 *     security:
 *       - BearerAdminAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved admin data
 *         content:
 *           application/json:
 *             example:
 *               users:
 *                 - username: exampleUser
 *                   name: John Doe
 *                   email: john@example.com
 *               RentalDetails:
 *                 - name: John Doe
 *                   phonenumber: 123456789
 *                   rentalDate: '2022-01-01T00:00:00.000Z'
 *                   ICnumber: 'ABC123'
 *                   email: john@example.com
 *               CarDetails:
 *                 - brand: Toyota
 *                   model: Corolla
 *                   year: 2022
 *                   colour: Blue
 *                   noplate: ABC-123
 *       500:
 *         description: Error fetching admin data
 * 
 * /admin-create-car:
 *   post:
 *     summary: Create car details by admin
 *     tags:
 *       - admin
 *     security:
 *       - BearerAdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CarDetails'
 *     responses:
 *       201:
 *         description: Car details created successfully by admin
 *       500:
 *         description: Error creating car details by admin
 * 
 * /admin-update-car/{carId}:
 *   patch:
 *     summary: Update car details by admin
 *     tags:
 *       - admin
 *     security:
 *       - BearerAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         schema:
 *           type: string
 *         required: true
 *         description: Car ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CarDetails'
 *     responses:
 *       200:
 *         description: Car details updated successfully by admin
 *       500:
 *         description: Error updating car details by admin
 * 
 * /admin-update-rental/{username}:
 *   patch:
 *     summary: Update user data by admin
 *     tags:
 *       - admin
 *     security:
 *       - BearerAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Username
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phonenumber:
 *                 type: string
 *               rentalDate:
 *                 type: string
 *               ICnumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: User data updated successfully by admin
 *       500:
 *         description: Error updating user data by admin
 * 
 * /admin-delete-car/{carId}:
 *   delete:
 *     tags:
 *       - admin
 *     summary: Delete car details by admin
 *     security:
 *       - BearerAdminAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         description: ID of the car details to delete
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       '200':
 *         description: Car details deleted successfully by admin
 *       '404':
 *         description: Car details not found
 *       '500':
 *         description: Error deleting car details by admin 
 */

export default {};