from pathlib import Path

# Tiedostot
SOURCE_FILE = Path("../sanat/nykysuomensanalista2024.txt")
OUTPUT_FILE = Path("../sanat/sanalista_aut_suodatettu.txt")

# Sallitut kirjaimet
ALLOWED_LETTERS = set("abcdefghijklmnopqrstuvwxyzåäö")

# Sanaluokat, jotka poistetaan
EXCLUDED_POS = {
    "adverbi",
    "prepositio",
    "postpositio",
    "konjunktio",
    "interjektio",
}


def is_valid_word(word: str) -> bool:
    """Tarkistaa, että sana sisältää tasan 8 sallittua kirjainta."""
    word = word.lower()

    return (
        len(word) == 8
        and all(char in ALLOWED_LETTERS for char in word)
    )


def main():
    if not SOURCE_FILE.exists():
        print(f"Virhe: lähdetiedostoa ei löydy: {SOURCE_FILE}")
        return

    words = set()

    total_lines = 0
    eight_letters = 0
    excluded_pos = 0
    invalid_chars = 0
    invalid_100 = 0
    duplicates = 0

    with SOURCE_FILE.open("r", encoding="utf-8") as file:
        for line in file:
            total_lines += 1

            line = line.rstrip("\n\r")

            # Ohitetaan tyhjät rivit
            if not line.strip():
                continue

            # Kotuksen aineisto on tab-eroteltu
            columns = line.split("\t")

            if len(columns) < 3:
                continue

            word = columns[0].strip().lower()
            pos = columns[2].strip().lower()

            # 1. Pituus
            if len(word) != 8:
                continue

            eight_letters += 1

            # 2. Vain sallitut kirjaimet
            if not all(char in ALLOWED_LETTERS for char in word):
                invalid_chars += 1
                continue

            # 3. Sanaluokka
            pos_list = {
                item.strip()
                for item in pos.split(",")
            }

            if pos_list & EXCLUDED_POS:
                excluded_pos += 1
                continue

            # 4. Taivutustiedot
            inflection = columns[3].strip() if len(columns) >= 4 else ""

            # 100 = väärin kirjoitettu sana
            if "100" in inflection:
                invalid_100 += 1
                continue

            # 5. Duplikaatit
            if word in words:
                duplicates += 1
                continue

            words.add(word)

    # Aakkosjärjestys
    sorted_words = sorted(words)

    # Luodaan kansio tarvittaessa
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Kirjoitetaan tulos
    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        for word in sorted_words:
            file.write(word + "\n")

    # Raportti
    print()
    print("=== SANALISTAN SUODATUS ===")
    print()
    print(f"Käsiteltyjä rivejä:       {total_lines}")
    print(f"8-kirjaimisia:             {eight_letters}")
    print(f"Virheellisiä merkkejä:     {invalid_chars}")
    print(f"Kielletty sanaluokka:      {excluded_pos}")
    print(f"Väärin kirjoitettu (100):  {invalid_100}")
    print(f"Duplikaatteja:             {duplicates}")
    print("--------------------------------")
    print(f"Lopullisia sanoja:         {len(sorted_words)}")
    print()
    print(f"Tallennettu: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
