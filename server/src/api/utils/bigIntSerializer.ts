/**
 * Utility for serializing BigInt values to strings in JSON
 */

/**
 * Serialize BigInt values to strings for JSON compatibility
 * @param data - The data to serialize
 * @returns The serialized data with BigInt values converted to strings
 */
export const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => 
      (typeof value === 'bigint' ? value.toString() : value)
    )
  ) as T;
};

/**
 * Alias for serializeBigInt for backward compatibility
 */
export const normalizeBigInt = serializeBigInt;
