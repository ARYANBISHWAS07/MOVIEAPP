import {
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import Details from "../movies/[id]";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import SearchBar from "@/components/searchBar";
import { useRouter } from "expo-router";
import useFetch from "@/services/useFetch";
import { fetchMovies } from "@/services/api";
import MovieCard from "@/components/MovieCard";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
const TRENDING_STORAGE_KEY = "trendingMovies";
const TRENDING_API_URL =
  "http://localhost:3000/api/trendingMovieData";

export default function Index() {
  const router = useRouter();
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(null);

  const {
    data: movies = [],
    loading: moviesLoading,
    error: moviesError,
  } = useFetch(() => fetchMovies({ query: "" }));

  // Fetch trending movies from API
  const FetchTrendingMovies = useCallback(async () => {
    try {
      const response = await axios.get(TRENDING_API_URL);
      const trendingData = response.data;

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        TRENDING_STORAGE_KEY,
        JSON.stringify(trendingData)
      );

      setTrending(trendingData);
      console.log("Trending movies fetched and stored:", trendingData);
      return trendingData;
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      setTrendingError(error);
      return null;
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  // Load trending movies from storage or API
  const LoadTrendingMovies = useCallback(async () => {
    setTrendingLoading(true);
    setTrendingError(null);

    try {
      const storedData = await AsyncStorage.getItem(TRENDING_STORAGE_KEY);

      if (storedData) {
        setTrending(JSON.parse(storedData));
        setTrendingLoading(false);

        FetchTrendingMovies();
      } else {
        await FetchTrendingMovies();
      }
    } catch (error) {
      console.error("Error loading trending movies:", error);
      setTrendingError(error);
      setTrendingLoading(false);
    }
  }, [FetchTrendingMovies]);

  useEffect(() => {
    LoadTrendingMovies();
  }, [LoadTrendingMovies]);

  const RenderTrendingItem = ({ item }: { item: any }) => {
    const imageBaseUrl = "https://image.tmdb.org/t/p/w500";
    const count = trending.findIndex((movie) => movie.title === item.title);
    return (
      <TouchableOpacity onPress={()=><Details/>} className="w-32 relative pl-5 gap-2">
        <Image
          source={{ uri: `${imageBaseUrl}${item.posterUrl}` }}
          className="w-full h-[200px] rounded-md"
          resizeMode="cover"
        />
        <View className="absolute bottom-9 -left-3.5 px-2 py-1 rounded-full">
          <MaskedView
            maskElement={
              <Text className="font-bold text-white text-6xl ">
                {count + 1}
              </Text>
            }
          >
            <Image
              source={images.rankingGradient}
              className="size-14"
              resizeMode="cover"
            />
          </MaskedView>
        </View>
        <Text
          className="text-sm font-bold mt-2 text-light-300"
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const isLoading = moviesLoading || trendingLoading;
  const hasError = moviesError || trendingError;

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="absolute w-full z-0" />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

        {isLoading ? (
          <ActivityIndicator size="large" color="#A8B5DB" className="mt-20" />
        ) : hasError ? (
          <Text className="text-blue-200">
            Error: {(moviesError || trendingError)?.message}
          </Text>
        ) : (
          <View className="flex-1 mt-5">
            <SearchBar  
              onPress={() => router.push("/search")}
              placeholder="Search for a movie"
            />

            {trending && trending.length > 0 && (
              <>
                <Text className="text-white text-2xl font-bold mt-5 mb-3">
                  Trending Movies
                </Text>
                <FlatList
                  data={trending}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) =>
                    `trending-${item.movie?.title || index}`
                  }
                  contentContainerStyle={{
                    paddingLeft: 5,
                    gap: 20,
                    paddingRight: 20,
                    paddingBottom: 10,
                  }}
                  renderItem={({ item }) => <RenderTrendingItem item={item} />}
                />
              </>
            )}

            {movies && movies.length > 0 && (
              <>
                <Text className="text-white text-2xl font-bold mt-5 mb-3">
                  Popular Movies
                </Text>
                <FlatList
                  data={movies}
                  renderItem={({ item }) => <MovieCard {...item} />}
                  keyExtractor={(item) => `popular-${item.id.toString()}`}
                  numColumns={3}
                  columnWrapperStyle={{
                    justifyContent: "space-between",
                    gap: 20,
                    marginBottom: 40,
                  }}
                  scrollEnabled={false}
                />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
