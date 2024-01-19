
import { Request, Response } from 'express';
import { Auth } from '../../../models/authModel';
import { UserProfile, UserProfileModel } from '../../../models/profileAdminModel';
import { errorMessages, successMessages } from '../../../middleware/messages';



export const updateUserProfile = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { userId } = req.params;
    const loggedInUserId = req.user?.userId;
    const loggedInUserRole = req.user?.rol;

    try {
        // Buscar al usuario por su userId junto con la información del perfil
        const user = await Auth.findOne({
            where: { id: userId },
            include: [{ model: UserProfile }],
        });

        // Si el usuario no existe, devolver un mensaje de error
        if (!user) {
            return res.status(404).json({ msg: errorMessages.userNotFound });
        }

        // Verificar si el usuario tiene permiso para actualizar el perfil
        if (loggedInUserRole === 'admin' || Number(userId) === loggedInUserId) {
            // El usuario es un administrador o está actualizando su propio perfil

          

            // Actualizar la información del perfil del usuario
            const userProfile = user.getDataValue('userProfile') as UserProfileModel;

            // Actualizar los campos del perfil según los datos proporcionados en la solicitud
            userProfile.firstName = req.body.firstName || userProfile.firstName;
            userProfile.lastName = req.body.lastName || userProfile.lastName;
            userProfile.biography = req.body.biography || userProfile.biography;
            userProfile.direccion = req.body.direccion || userProfile.direccion;

            // Actualizar los campos adicionales profileType y messageType si se proporcionan en la solicitud
            userProfile.profileType = req.body.profileType !== undefined ? req.body.profileType : userProfile.profileType;
            userProfile.messageType = req.body.messageType !== undefined ? req.body.messageType : userProfile.messageType;

          

            // Guardar los cambios en la base de datos
            await userProfile.save();

            // Devolver la información del perfil actualizada en un objeto JSON
            return res.json({
                userId: user.id,
                username: user.username,
                email: user.email,
                rol: user.rol,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                biography: userProfile.biography,
                direccion: userProfile.direccion,
                profileType: userProfile.profileType,
                messageType: userProfile.messageType,
                profilePicture: userProfile.profilePicture,
                status: userProfile.status,
            });
        } else {
            // Si el usuario no es un administrador y no está actualizando su propio perfil, devolver un error de acceso no autorizado
            return res.status(403).json({ msg: errorMessages.accessDenied });
        }
    } catch (error) {
        // Manejar errores internos del servidor y registrarlos en la consola
        console.error('Error al actualizar el perfil del usuario:', error);
        return res.status(500).json({ msg: errorMessages.serverError });
    }
};

// Definir una interfaz extendida de Request para incluir información del usuario
interface CustomRequest extends Request {
    user?: {
        userId: number;
        rol: string;
        // Agrega otras propiedades según sea necesario
    };
}

/**
 * Controlador para obtener el perfil de un usuario por su ID.
 * @param {CustomRequest} req - Objeto de solicitud que debe contener un parámetro 'userId' en los parámetros de la ruta y un objeto 'user' con información del usuario autenticado.
 * @param {Response} res - Objeto de respuesta utilizado para enviar la respuesta al cliente.
 * @returns {Promise<Response>} Retorna un objeto JSON con el perfil del usuario o mensajes de error.
 */
export const getUserProfile = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { userId } = req.params;
    const loggedInUserId = req.user?.userId; // Obtener el userId del usuario que inició sesión

    try {
        // Buscar al usuario por su userId junto con la información del perfil
        const user = await Auth.findOne({
            where: { id: userId },
            include: [{ model: UserProfile }],
        });

        // Si el usuario no existe, devolver un mensaje de error
        if (!user) {
            return res.status(404).json({ msg: errorMessages.userNotFound });
        }

        // Si el usuario es un administrador o el userId coincide con el que inició sesión, permite el acceso
        if (req.user?.rol === 'admin' || Number(userId) === loggedInUserId) {
            // Obtener la información del perfil del usuario
            const userProfile = user.getDataValue('userProfile') as UserProfileModel;

            // Devolver la información del perfil del usuario en un objeto JSON
            const imageUrl = `http://localhost:3011/uploads/${userProfile.profilePicture}`;

            return res.json({
                userId: user.id,
                username: user.username,
                email: user.email,
                rol: user.rol,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                biography: userProfile.biography,
                direccion: userProfile.direccion,
                profileType: userProfile.profileType,
                messageType: userProfile.messageType,
                profilePicture: userProfile.profilePicture,
                status: userProfile.status,
            });
        } else {
            // Si no es un administrador y el userId no coincide, devolver un error de acceso no autorizado
            return res.status(403).json({ msg: errorMessages.accessDenied });
        }
    } catch (error) {
        // Manejar errores internos del servidor y registrarlos en la consola
        console.error('Error al obtener el perfil del usuario:', error);
        return res.status(500).json({ msg: errorMessages.serverError });
    }
};
