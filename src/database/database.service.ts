import { Injectable } from "@nestjs/common";
import { initDB } from "./connection.database";
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";

@Injectable()
export class DatabaseService {
  constructor(private readonly dbConfig = initDB()) { }

  /**
   * @description Busca um documento no banco pelo ID
   * @param collectionName
   * @param docId
   */
  async getDoc(collectionName: string, docId: string): Promise<{} | { id: string, data: any }> {
    try {
      if (!collectionName || !collectionName.length) {
        console.error('[ERROR] -> collectionName não pode ser vazio');
        throw new Error('[DATABASE] -> collectionName não pode estar vazio')
      }
      if (!docId || !docId.length) {
        console.error('[ERROR] -> docId não pode ser vazio');
        throw new Error('[DATABASE] -> docId não pode estar vazio')
      }

      const docRef = doc(this.dbConfig, collectionName, docId)

      const foundedDoc = await getDoc(docRef)

      if (!foundedDoc.exists()) {
        throw new Error(`Documento '${docId}' não encontrado`)
      }

      return {
        id: foundedDoc.id,
        data: foundedDoc.data()
      }
    } catch (e) {
      console.log('[ERROR] - ocorreu algum erro ao buscar o documento', e)
      throw e;
    }
  }

  /**
   * @description Busca todos os documentos de uma collection
   * @param collectionName: string
   */
  async getCollection(collectionName: string): Promise<[{ id: string, data: any }] | any[]> {
    try {

      if (!collectionName || collectionName.length) throw new Error('collectionName não pode ser vazio')

      const dbRef = collection(this.dbConfig, collectionName)
      const returnedData = await getDocs(dbRef)
      const data: any[] = []

      returnedData.forEach((doc) => {
        data.push({
          id: doc.id,
          data: doc.data()
        })
      })

      console.info(`[INFO] -> foram encontrados ${data.length} registros`)

      return data;
    } catch (e) {
      console.error(`[ERROR] -> ocorreu um erro ao fazer a busca da collection ${collectionName}`)
      throw e;
    }
  }

  /**
   * @description Atualiza um documento específico do banco de dados
   * @param collectionName 
   * @param docId 
   * @param newData 
   */
  async updateDoc(collectionName: string, docId: string, newData: object) {
    try {
      if (!collectionName || !collectionName.length) throw new Error('collectionName não pode ser vazio');
      if (!docId || !docId.length) throw new Error('docId não pode ser vazio');
      if (!newData) throw new Error('newData não pode ser vazio');

      const docRef = doc(this.dbConfig, collectionName, docId);
      await updateDoc(docRef, newData).then(() => {
        console.log(`[DATABASE] -> sucesso ao atualizar o documento ${docId} com os dados: ${newData}`)
        return true
      });

    } catch (e) {
      console.error(`[DATABASE] -> falha ao fazer o update do documento '${docId}' com os dados: ${newData}`);
      throw e;
    }
  }

  /**
   * @description Apaga um documento do banco de dados
   * @param collectionName 
   * @param docId 
   * @returns {boolean}
   */
  async delDoc(collectionName: string, docId: string): Promise<boolean> {
    try {

      if (!collectionName || !collectionName.length) throw new Error('collectionName não pode ser vazio')
      if (!docId || !docId.length) throw new Error('docId não pode ser vazio')
      const docRef = doc(this.dbConfig, collectionName, docId)

      await deleteDoc(docRef).catch((e) => { throw new Error('Falha ao remover documento do banco de dados: ', e) })

      return true

    } catch (e) {
      console.error(`[DATABASE] -> Falha ao remover o documento: ${docId} da collection ${collectionName}`)
      throw e
    }

  }

}