import{
    CognitoUserPool,
    CognitoUserAttribute
} from 'amazon-cognito-identity-js';

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments.dev';

const poolData = {
    UserPoolId: environment.cognito.userPoolId,
    ClientId: environment.cognito.clientId
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userPool = new CognitoUserPool(poolData);

    registerUser(data: {
        fullName: string,
        email: string,
        phone: string,
        password: string,
        typeDocument: string,
        numberDocument: string
    }): Promise<any> {
        
        const phoneFormatted = this.formatPhoneNumber(data.phone);

        const attributes: CognitoUserAttribute[] = [
            new CognitoUserAttribute({ Name: 'email', Value: data.email }),
            new CognitoUserAttribute({ Name: 'phone_number', Value: phoneFormatted}),

            // Custom attributes
            new CognitoUserAttribute({ Name: 'custom:full_name', Value: data.fullName}),
            new CognitoUserAttribute({ Name: 'custom:type_document', Value: data.typeDocument}),
            new CognitoUserAttribute({ Name: 'custom:number_document', Value: data.numberDocument})
        ];

        return new Promise((resolve, reject) => {
            this.userPool.signUp(
                data.email,
                data.password,
                attributes,
                [],
                (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(result);
                } 
            )
        })
    }
    formatPhoneNumber(phone: string): string {
        let clean = phone.replace(/\D/g, '');

        if (clean.startsWith('57')) {
            return `+57${clean}`;
        }
        
        return `+57${clean}`;
    }
}

