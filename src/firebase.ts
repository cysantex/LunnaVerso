import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Chapter, PortalConfig } from "./types";

// Initialize standard Firebase applet clients
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Error tracking structures matching Phase 3 constraints
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error Detailed Logs: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on start up
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration or network.");
    }
  }
}

// Collection string constants
const SETTINGS_COLLECTION = "portalSettings";
const CHAPTERS_COLLECTION = "chapters";

// Default local initial configurations to seed if Firestore is empty
export const SEED_CONFIG: PortalConfig = {
  bookTitle: "Tudo o Que Esperamos",
  authorName: "Carolina S. Mendes",
  welcomeTitle: "Espaço do Leitor: Um Presente Para Você",
  welcomeMessage: "Criamos este portal exclusivo como um abraço em cada um de nossos leitores. Aqui reunimos as ilustrações que traduzem em cores a doçura desta jornada apaixonante do jovem casal, a dor das tentativas, o milagre da gestação gemelar e a força inabalável dos laços de amizade. Sinta-se em casa e mergulhe em nossas memórias ilustradas.",
  romanticDedicatory: "Dedicado a todos aqueles que guardam a paciência no peito e acreditam na beleza dos milagres cotidianos."
};

export const SEED_CHAPTERS: Chapter[] = [
  {
    id: "chap1",
    number: 1,
    title: "O Encontro de Duas Almas",
    subtitle: "Duas vidas que se cruzam sob a brisa morna do acaso.",
    shortDescription: "Aquele silencioso e tímido esbarrar na biblioteca antiga, onde o batimento de dois corações começou a bater em um mesmo compasso.",
    fullStory: "Era uma tarde comum de outono, com a luz dourada do sol filtrando pelas venezianas da biblioteca antiga, criando feixes de poeira mágica e calor. Entre estantes repletas de romances clássicos e o cheiro nostálgico de páginas antigas, seus dedos se tocaram por acidente ao alcançar o mesmíssimo exemplar. Um pedido de desculpas acanhado, um sorriso que brilhou sem aviso e uma faísca invisível que mudou tudo. Naquela tarde, duas trajetórias distintas colidiram e deram início à mais linda de todas as jornadas de amor.",
    imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80",
    romanticQuote: "O destino é apenas o amor sussurrando em segredo através das para-coincidências."
  },
  {
    id: "chap2",
    number: 2,
    title: "O Silêncio e a Esperança",
    subtitle: "A caminhada firme nas noites mais longas de espera.",
    shortDescription: "O desejo infinito de gerar uma vida, as tentativas repletas de fé e o abraço apertado nos dias em que o teste dizia 'não'.",
    fullStory: "Muitos meses se passaram. Estações mudaram, o tempo soprou e a expectativa silenciosa renovava-se a cada ciclo. Houve dias de lágrimas ocultadas, silêncios densos e testes que teimavam em mostrar apenas uma lixeira solitária. Mas o que poderia arrefecer as forças do casal, apenas os uniu de forma inquebrável. Eles aprenderam a orar juntos, a acalentar os receios um do outro e a partilhar um abraço eterno que dizia mais do que mil palavras. A promessa deles de serem pais estava guardada nas estrelas, amadurecendo o amor na terra fértil da paciência.",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
    romanticQuote: "As raízes mais fortes crescem nas tempestades, preparando o solo para a mais bela das floradas."
  },
  {
    id: "chap3",
    number: 3,
    title: "Milagre em Dobro",
    subtitle: "Duas pequenas batidas que ecoaram como o som mais lindo do universo.",
    shortDescription: "O choro incontrolável de pura alegria na sala de ultrassom: a revelação de que não vinha apenas um milagre, mas dois!",
    fullStory: "O consultório estava em silêncio. Um gel frio na pele e a tela escura que, de repente, acendeu-se de esperança. A médica focou a imagem, sorriu calorosamente e aumentou o som do monitor. De imediato, um som rítmico, rápido e perfeito preencheu o espaço: tic-tac, tic-tac! E antes mesmo do primeiro suspiro de alívio, um segundo compasso se somou: tic-tac, tic-tac! 'Aqui está um coraçãozinho... e bem aqui do lado, temos outro! São gêmeos!'. Naquele instante, as lágrimas que rolaram lavaram para sempre o cansaço dos anos de espera. O amor havia transbordado e se conhecido multiplicado por dois.",
    imageUrl: "https://images.unsplash.com/photo-1551556729-c4db4bab7e50?auto=format&fit=crop&w=1200&q=80",
    romanticQuote: "Quando a resposta do céu vem, ela não apenas sacia o coração, ela o faz transbordar em dobro."
  },
  {
    id: "chap4",
    number: 4,
    title: "Cercados de Afeto",
    subtitle: "O carinho precioso da família que escolhemos.",
    shortDescription: "Os amigos e familiares que trouxeram doçura, colo, risadas espontâneas e prepararam cada detalhe para acolher os pequenos.",
    fullStory: "Gerar dois bebês era um desafio monumental, mas eles nunca estiveram sós. Uma rede inestimável de amigos queridos e familiares se formou ao redor deles como um escudo de amor. Eram amigos trazendo guloseimas para saciar os desejos da madrugada, montando os berços com piadas e gargalhadas, e tricotando mantinhas com as melhores vibrações do mundo. No dia do chá de fraldas surpresa, ao verem a casa inundada de sorrisos honestos, o casal compreendeu que aqueles gêmeos não teriam apenas pais dedicados, mas uma tribo inteira pronta para guiá-los pela vida com afeto puro.",
    imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    romanticQuote: "Amigos de verdade são extensões do amor divino, prontos para celebrar nossos maiores milagres."
  },
  {
    id: "chap5",
    number: 5,
    title: "O Início do Nosso Sempre",
    subtitle: "O toque suave, a pele macia e a calmaria da promessa cumprida.",
    shortDescription: "O primeiro amanhecer em casa, o cheirinho doce de bebê e a certeza de que todo o caminho valeu a pena.",
    fullStory: "As luzes do quarto dos bebês estavam abrandadas. O som das caixinhas de música dedilhava uma melodia doce e sonolenta. Exaustos, mas envolvidos por uma paz que sequer sabiam existir, os jovens pais olharam para os berços emparelhados. Dois rostinhos serenos, respirando suavemente. Eles se abraçaram devagarinho, encostando a testa um no outro, e permitiram que o silêncio repleto de gratidão falasse por eles. Toda dor, toda espera, todos os testes negativos haviam sido apagados pela doçura daquele instante. A nova vida começava ali, embalada pelo som terno de dois pequenos milagres respirando em uníssono.",
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    romanticQuote: "O amor paciente não é aquele que apenas espera sem fraquejar, mas o que reconstrói a esperança a cada amanhecer."
  }
];

// Read global Portal Settings from Firestore
export async function getPortalSettings(): Promise<PortalConfig> {
  const docPath = `${SETTINGS_COLLECTION}/global`;
  try {
    const docSnap = await getDoc(doc(db, SETTINGS_COLLECTION, "global"));
    if (docSnap.exists()) {
      return docSnap.data() as PortalConfig;
    } else {
      // Seed initial data if blank so there is no empty UI
      await savePortalSettings(SEED_CONFIG);
      return SEED_CONFIG;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
    return SEED_CONFIG;
  }
}

// Write/Save Portal Settings to Firestore
export async function savePortalSettings(settings: PortalConfig): Promise<void> {
  const docPath = `${SETTINGS_COLLECTION}/global`;
  try {
    const dataToSave = {
      bookTitle: settings.bookTitle.trim(),
      authorName: settings.authorName.trim(),
      welcomeTitle: settings.welcomeTitle.trim(),
      welcomeMessage: settings.welcomeMessage.trim(),
      romanticDedicatory: settings.romanticDedicatory.trim(),
    };
    await setDoc(doc(db, SETTINGS_COLLECTION, "global"), dataToSave);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

// Read Chapters collection ordered by chapter number
export async function getChapters(): Promise<Chapter[]> {
  const collectionPath = CHAPTERS_COLLECTION;
  try {
    const q = query(collection(db, collectionPath), orderBy("number", "asc"));
    const querySnapshot = await getDocs(q);
    const results: Chapter[] = [];
    querySnapshot.forEach((docSnap) => {
      results.push(docSnap.data() as Chapter);
    });

    if (results.length === 0) {
      // Seeding chapters sequence if database is completely initialized for the first time
      for (const chap of SEED_CHAPTERS) {
        await saveChapter(chap);
      }
      return SEED_CHAPTERS;
    }

    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
    return SEED_CHAPTERS;
  }
}

// Save or Update a single Chapter
export async function saveChapter(chapter: Chapter): Promise<void> {
  const docPath = `${CHAPTERS_COLLECTION}/${chapter.id}`;
  try {
    const dataToSave = {
      id: chapter.id,
      number: Number(chapter.number),
      title: chapter.title.trim(),
      subtitle: chapter.subtitle.trim(),
      shortDescription: chapter.shortDescription.trim(),
      fullStory: chapter.fullStory.trim(),
      imageUrl: chapter.imageUrl.trim(),
      romanticQuote: chapter.romanticQuote.trim(),
    };
    await setDoc(doc(db, CHAPTERS_COLLECTION, chapter.id), dataToSave);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

// Delete a chapter
export async function deleteChapter(chapterId: string): Promise<void> {
  const docPath = `${CHAPTERS_COLLECTION}/${chapterId}`;
  try {
    await deleteDoc(doc(db, CHAPTERS_COLLECTION, chapterId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

/**
 * Converte URLs de imagem comuns em links diretos para renderização no HTML.
 * Suporta Google Drive (links de compartilhamento público) e Dropbox.
 */
export function getDirectImageUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // 1. Google Drive regex para /file/d/ID/view ou /file/d/ID/edit
  const driveFileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileDMatch && driveFileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileDMatch[1]}`;
  }

  // 2. Google Drive regex para ?id=ID ou &id=ID (ex: uc?id=ID)
  const driveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes("drive.google.com") && driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  // 3. Dropbox (substitui www.dropbox.com por dl.dropboxusercontent.com ou adiciona dl=1)
  if (trimmed.includes("dropbox.com")) {
    return trimmed.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "?raw=1");
  }

  return trimmed;
}
