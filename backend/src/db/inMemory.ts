
interface inMemoryTableInterface {
    
    [authenticationCode: string]: {
        expiresAt: number,
        clientId: string,
        clientSecret: string,
        userId: string,
        userEmail: string,
    };
}

const inMemoryTable: inMemoryTableInterface = {};

export default inMemoryTable;