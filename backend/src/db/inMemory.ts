interface inMemoryTableInterface {
    [clientId: string]: {
        clientSecret: string;
        authentication: {
            code: string,
            expiresAt: number
        };
    };
}

const inMemoryTable: inMemoryTableInterface = {};

export default inMemoryTable;