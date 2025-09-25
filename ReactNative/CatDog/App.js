import React, { useState, useEffect, memo } from "react"; // 👈 Se importa 'memo'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  FlatList,
  ImageBackground,
  SafeAreaView,
} from "react-native";

const API_KEY = ""; // <- Opcional
const CAT_API_URL = "https://api.thecatapi.com/v1/images/search";
const DOG_API_URL = "https://api.thedogapi.com/v1/images/search";
const CAT_BREEDS_URL = "https://api.thecatapi.com/v1/breeds";
const DOG_BREEDS_URL = "https://api.thedogapi.com/v1/breeds";

const headersWithKey = API_KEY ? { "x-api-key": API_KEY } : {};

// Componente para el Encabezado, envuelto en memo
const HeaderComponent = memo(({ animalType, search, onAnimalTypeChange, onSearch }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Buscador de Mascotas</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.button,
            animalType === "dog" ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => onAnimalTypeChange("dog")}
        >
          <Text style={styles.buttonText}>Perros</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            animalType === "cat" ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => onAnimalTypeChange("cat")}
        >
          <Text style={styles.buttonText}>Gatos</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder={`Buscar raza de ${animalType === "dog" ? "perro" : "gato"}...`}
        value={search}
        onChangeText={onSearch}
      />
    </View>
  );
});

// Componente para el Pie de Página, envuelto en memo
const FooterComponent = memo(({ loading, imageUrl, error, breedInfo }) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageBox}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <Text style={styles.message}>{error || "Selecciona una raza para ver su imagen."}</Text>
        )}
      </View>
      {breedInfo && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{breedInfo.name}</Text>
          {breedInfo.description && <Text style={styles.infoText}>{breedInfo.description}</Text>}
          {breedInfo.temperament && (
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Temperamento: </Text>{breedInfo.temperament}</Text>
          )}
          {breedInfo.origin && (
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Origen: </Text>{breedInfo.origin}</Text>
          )}
          {breedInfo.life_span && (
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Esperanza de vida: </Text>{breedInfo.life_span} años</Text>
          )}
          {breedInfo.weight?.metric && (
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Peso: </Text>{breedInfo.weight.metric} kg</Text>
          )}
        </View>
      )}
    </View>
  );
});

export default function App() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [breeds, setBreeds] = useState([]);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const [animalType, setAnimalType] = useState("dog");
  const [breedInfo, setBreedInfo] = useState(null);

  useEffect(() => {
    fetchBreeds("dog");
  }, []);

  const fetchBreeds = async (type) => {
    try {
      const url = type === "cat" ? CAT_BREEDS_URL : DOG_BREEDS_URL;
      const res = await fetch(url, { headers: headersWithKey });
      const data = await res.json();
      setBreeds(data || []);
      setFilteredBreeds(data || []);
    } catch (e) {
      console.error("fetchBreeds:", e);
      setBreeds([]);
      setFilteredBreeds([]);
    }
  };

  const fetchAnimal = async (type, breedId = null) => {
    setLoading(true);
    setError("");
    try {
      let url = type === "cat" ? CAT_API_URL : DOG_API_URL;
      let params = new URLSearchParams({ limit: "1" });
      if (breedId) {
        params.append("breed_ids", breedId);
      }
      const res = await fetch(`${url}?${params.toString()}`, { headers: headersWithKey });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.length > 0 && data[0].url) {
        setImageUrl(data[0].url);
      } else {
        setError("No se encontró imagen para esta raza.");
      }
    } catch (e) {
      console.error("fetchAnimal:", e);
      setError("Error al cargar la imagen. Revisa la red.");
    } finally {
      setLoading(false);
    }
  };

  const onSelectBreed = (item) => {
    setSearch(item.name);
    setFilteredBreeds([]);
    setBreedInfo(item);
    fetchAnimal(animalType, item.id);
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (!text) {
      setFilteredBreeds([]);
      return;
    }
    const filtered = breeds.filter((b) =>
      b.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredBreeds(filtered);
  };

  const handleAnimalTypeChange = (type) => {
    setAnimalType(type);
    fetchBreeds(type);
    setSearch("");
    setBreedInfo(null);
    setImageUrl(null);
    setError("");
  };

  return (
    <ImageBackground
      source={{ uri: "https://i.pinimg.com/originals/a7/23/a7/a723a7465e94366112528c1c23861286.jpg" }}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <FlatList
          data={search.length > 0 ? filteredBreeds : []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.cardSuggestion}>
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => onSelectBreed(item)}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={
            <HeaderComponent 
              animalType={animalType} 
              search={search} 
              onAnimalTypeChange={handleAnimalTypeChange}
              onSearch={handleSearch}
            />
          }
          ListFooterComponent={
            <FooterComponent 
              loading={loading}
              imageUrl={imageUrl}
              error={error}
              breedInfo={breedInfo}
            />
          }
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { paddingHorizontal: 16, paddingBottom: 40 },
    card: {
      backgroundColor: "rgba(255, 255, 255, 0.92)",
      padding: 20,
      borderRadius: 24,
      width: "100%",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      marginTop: 20,
    },
    cardSuggestion: {
      backgroundColor: "rgba(255, 255, 255, 0.92)",
      paddingHorizontal: 20,
      width: '100%',
      alignSelf: 'center',
    },
    title: { fontSize: 28, fontWeight: "bold", color: "#1F2937", marginBottom: 20 },
    buttonRow: { flexDirection: "row", marginBottom: 20 },
    button: { flex: 1, paddingVertical: 12, borderRadius: 30, marginHorizontal: 5 },
    activeButton: { backgroundColor: "#007AFF" },
    inactiveButton: { backgroundColor: "#AAB8C2" },
    buttonText: { color: "white", fontWeight: "bold", fontSize: 16, textAlign: "center" },
    searchInput: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#D1D5DB",
      borderRadius: 12,
      padding: 12,
      backgroundColor: "#FFF",
      fontSize: 16,
    },
    suggestionItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#F3F4F6" },
    imageBox: {
      width: "100%",
      height: 300,
      backgroundColor: "#F0F0F0",
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
      overflow: "hidden",
    },
    image: { width: "100%", height: "100%", resizeMode: "cover" },
    message: { color: "#6B7280", textAlign: "center", padding: 20 },
    infoBox: {
      width: "100%",
      backgroundColor: "#F3F4F6",
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
    },
    infoTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: "#111827" },
    infoText: { fontSize: 16, marginBottom: 6, color: "#374151", lineHeight: 24 },
    infoLabel: { fontWeight: "bold" },
});