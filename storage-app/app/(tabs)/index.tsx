import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, FlatList, Image, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, list, getDownloadURL, deleteObject } from "firebase/storage";

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);  // Inicializar como array vazio
  const [visible, setVisible] = useState(false);

  const firebaseConfig = {
    apiKey: "AIzaSyAx5D5PeFmbRFb5suBmzzDd1O1LYEx05gg",
    authDomain: "storage-app-111a9.firebaseapp.com",
    projectId: "storage-app-111a9",
    storageBucket: "storage-app-111a9.appspot.com",
    messagingSenderId: "893078971400",
    appId: "1:893078971400:web:efaffc4b5a687bf1b2ddbd",
    measurementId: "G-Q4C0XS8F7B"
  };

  // Inicializar Firebase
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);

  // Função para converter URI em blob
  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  // Função para escolher a imagem
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // Corrigir o acesso ao URI
      console.log(result.assets[0].uri);
    }
  };

  // Função para gerar um nome aleatório para a imagem
  function getRandom(max) {
    return Math.floor(Math.random() * max + 1);
  }

  // Função para fazer o upload da imagem
  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Selecione uma imagem antes de enviar.');
      return;
    }

    try {
      setUploading(true);  // Começar o upload
      const blob = await uriToBlob(imageUri);

      // Criar uma referência com um nome aleatório
      const fileName = `images/image_${getRandom(10000)}.jpg`;
      const imageRef = ref(storage, fileName);

      // Fazer o upload do arquivo
      await uploadBytes(imageRef, blob, {
        contentType: 'image/jpeg'  // Especificar o tipo MIME
      });

      Alert.alert('Imagem enviada com sucesso!');
      setImageUri(null);  // Resetar o URI da imagem após o upload
      LinkImage(); // Atualizar a lista de imagens após o upload
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      Alert.alert('Erro ao enviar a imagem.');
    } finally {
      setUploading(false);  // Terminar o upload
    }
  };

  // Função para listar as imagens do Firebase Storage
  async function LinkImage() {
    try {
      // Referência para listar os arquivos
      const listRef = ref(storage, 'images/');

      // Buscar a primeira página de 100 imagens
      const firstPage = await list(listRef, { maxResults: 100 });
      const lista = [];

      // Percorrer cada item e obter o link
      for (const item of firstPage.items) {
        const link = await getDownloadURL(item);
        lista.push({ key: item.name, link, path: item.fullPath });
      }

      setImages(lista);
      setVisible(true);
      console.log(lista);
    } catch (error) {
      console.error('Erro ao listar imagens:', error);
    }
  }

  // Função para deletar uma imagem do Firebase Storage
  const deleteImage = async (path) => {
    try {
      const imageRef = ref(storage, path); // Usar o caminho completo
      await deleteObject(imageRef);
      Alert.alert('Imagem deletada com sucesso!');
      
      // Atualizar a lista de imagens localmente após a exclusão
      setImages(images.filter(image => image.path !== path));
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      Alert.alert('Erro ao deletar a imagem.');
    }
  };

  // Renderizar o item no FlatList
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.link }} style={styles.image} />
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteImage(item.path)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="Escolher Imagem" onPress={pickImage} />
      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <Button title="Confirmar Upload" onPress={uploadImage} />
        </View>
      )}
      {uploading && <ActivityIndicator size="large" color="#0000ff" />}
      <Button title="Listar Imagens" onPress={LinkImage} />
      {visible && (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={item => item.key}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  previewImage: {
    width: 300,
    height: 300,
    marginBottom: 10,
  },
  item: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#ff0000',
    padding: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
