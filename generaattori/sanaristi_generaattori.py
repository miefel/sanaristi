from pathlib import Path
import json
import random
import time


# ============================================================
# ASETUKSET
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

WORD_FILE = BASE_DIR / "sanat" / "sanalista_aut_suodatettu.txt"
OUTPUT_FILE = BASE_DIR / "sanaristit" / "sanaristit.json"

PUZZLES_TO_GENERATE = 10000


# ============================================================
# SANALISTA
# ============================================================

def load_words():
    with WORD_FILE.open("r", encoding="utf-8") as file:
        words = {
            line.strip().lower()
            for line in file
            if line.strip()
        }

    return sorted(
        word
        for word in words
        if len(word) == 8
    )


def middle(word):
    return word[2:6]

def build_grid(horizontal, vertical):
    """
    Rakentaa sanaristin 8x8 grid-muotoon.

    Merkinnät:
        kirjain = annettu kirjain
        .       = käyttäjän täytettävä ruutu
        -       = ruutu, jonka reunaviivoja ei piirretä
    """

    grid = [
        list("--....--"),
        list("--....--"),
        list("........"),
        list("........"),
        list("........"),
        list("........"),
        list("--....--"),
        list("--....--"),
    ]

    # --------------------------------------------------------
    # Vaakasanat
    #
    # Jokainen sana:
    #
    # XX ABCD XX
    #
    # sijoittuu riveille 0, 1, 6, 7 sekä
    # riveille 2-5.
    # --------------------------------------------------------

    for row, word in enumerate(horizontal):

        # Ensimmäiset kaksi kirjainta
        grid[row + 2][0] = word[0]
        grid[row + 2][1] = word[1]

        # Viimeiset kaksi kirjainta
        grid[row + 2][6] = word[6]
        grid[row + 2][7] = word[7]

        # Keskimmäiset neljä ovat käyttäjän täytettäviä
        # eli jätetään "."-merkeiksi.

    # --------------------------------------------------------
    # Pystysanojen annetut kirjaimet
    #
    # Pystysana:
    #
    # XX ABCD XX
    #
    # sijoitetaan sarakkeisiin 2-5.
    # --------------------------------------------------------

    for column, word in enumerate(vertical):

        # Ensimmäiset kaksi
        grid[0][column + 2] = word[0]
        grid[1][column + 2] = word[1]

        # Viimeiset kaksi
        grid[6][column + 2] = word[6]
        grid[7][column + 2] = word[7]

    return [
        "".join(row)
        for row in grid
    ]


# ============================================================
# KESKIOSA-INDEKSI
# ============================================================

def build_index(words):
    """
    Muodostaa:

        exact["abcd"]
            -> kaikki 8-kirjaimiset sanat,
               joiden keskiosa on abcd

        prefix["a"]
        prefix["ab"]
        prefix["abc"]
        prefix["abcd"]

    Näin voidaan tarkistaa nopeasti,
    voiko keskiosan alku vielä johtaa olemassa
    olevaan sanaan.
    """

    exact = {}

    prefix = {
        1: set(),
        2: set(),
        3: set(),
        4: set(),
    }

    for word in words:

        mid = middle(word)

        exact.setdefault(mid, []).append(word)

        for length in range(1, 5):
            prefix[length].add(
                mid[:length]
            )

    return exact, prefix


# ============================================================
# WORD SQUARE - HAKU
# ============================================================

def can_continue(prefix_string, prefix_index):
    """
    Tarkistaa, onko annetulla kirjainalkuosalla
    mahdollista muodostaa jokin keskiosa.
    """

    if not prefix_string:
        return True

    length = len(prefix_string)

    return (
        prefix_string
        in prefix_index[length]
    )


def find_square(prefix_index):
    """
    Etsii 4x4-keskiruudukon.

    Jokaisen rivin ja sarakkeen pitää olla
    olemassa oleva 4-kirjaiminen keskiosa.
    """

    rows = []

    # --------------------------------------------------------
    # Valitaan yksi rivi kerrallaan.
    # --------------------------------------------------------

    possible_rows = list(
        prefix_index[4]
    )

    random.shuffle(possible_rows)

    def backtrack():

        # Neljä riviä valittu
        if len(rows) == 4:

            # Tarkistetaan sarakkeet
            columns = [
                "".join(
                    rows[row][column]
                    for row in range(4)
                )
                for column in range(4)
            ]

            if all(
                column in prefix_index[4]
                for column in columns
            ):
                return columns

            return None

        # ----------------------------------------------------
        # Kokeillaan seuraavaa riviä.
        # ----------------------------------------------------

        candidates = possible_rows.copy()
        random.shuffle(candidates)

        for candidate in candidates:

            # -----------------------------------------------
            # Sarakkeiden prefixit muodostetaan heti.
            # -----------------------------------------------

            valid = True

            for column in range(4):

                column_prefix = "".join(
                    rows[row][column]
                    for row in range(len(rows))
                )

                column_prefix += candidate[column]

                if not can_continue(
                    column_prefix,
                    prefix_index
                ):
                    valid = False
                    break

            if not valid:
                continue

            rows.append(candidate)

            result = backtrack()

            if result is not None:
                return result

            rows.pop()

        return None

    columns = backtrack()

    if columns is None:
        return None

    return rows, columns


# ============================================================
# MUUTETAAN KESKIOSAT OIKEIKSI SANOIKSI
# ============================================================

def choose_words(
    middles,
    exact,
    used_words=None
):
    """
    Muuttaa neljä keskiosaa neljäksi
    oikeaksi 8-kirjaimiseksi sanaksi.
    """

    if used_words is None:
        used_words = set()

    candidates = []

    for mid in middles:

        words = [
            word
            for word in exact[mid]
            if word not in used_words
        ]

        if not words:
            return None

        candidates.append(words)

    # Valitaan yksi sana kustakin keskiosasta.
    # Jos jollakin keskiosalla on vain vähän
    # vaihtoehtoja, käsitellään se ensin.

    order = sorted(
        range(4),
        key=lambda i: len(candidates[i])
    )

    selected = [None] * 4
    selected_set = set()

    def backtrack(index):

        if index == 4:
            return True

        position = order[index]

        options = candidates[position].copy()
        random.shuffle(options)

        for word in options:

            if word in selected_set:
                continue

            selected[position] = word
            selected_set.add(word)

            if backtrack(index + 1):
                return True

            selected_set.remove(word)
            selected[position] = None

        return False

    if not backtrack(0):
        return None

    return selected


# ============================================================
# KOKO RISTIKON TARKISTUS
# ============================================================

def validate_puzzle(horizontal, vertical):

    if len(horizontal) != 4:
        return False

    if len(vertical) != 4:
        return False

    all_words = horizontal + vertical

    # Kaikkien kahdeksan sanan pitää olla eri
    if len(set(all_words)) != 8:
        return False

    # Tarkistetaan risteäminen
    for column in range(4):

        expected = "".join(
            middle(word)[column]
            for word in horizontal
        )

        actual = middle(vertical[column])

        if expected != actual:
            return False

    return True


# ============================================================
# YKSI RISTIKKO
# ============================================================

def generate_one(
    words,
    exact,
    prefix
):

    result = find_square(prefix)

    if result is None:
        return None

    horizontal_middles, vertical_middles = result

    # Muutetaan keskiosat oikeiksi sanoiksi
    horizontal = choose_words(
        horizontal_middles,
        exact
    )

    if horizontal is None:
        return None

    used = set(horizontal)

    vertical = choose_words(
        vertical_middles,
        exact,
        used
    )

    if vertical is None:
        return None

    if not validate_puzzle(
        horizontal,
        vertical
    ):
        return None

    return {
        "horizontal": horizontal,
        "vertical": vertical
    }


# ============================================================
# TULOSTUS
# ============================================================

def print_puzzle(puzzle):

    horizontal = puzzle["horizontal"]
    vertical = puzzle["vertical"]

    print()
    print("  Vaaka:")

    for word in horizontal:
        print(f"    {word}")

    print()
    print("  Pysty:")

    for word in vertical:
        print(f"    {word}")

    print()
    print("  4x4:")

    for word in horizontal:
        print(
            "    "
            + " ".join(middle(word))
        )

    print()


# ============================================================
# PÄÄOHJELMA
# ============================================================

def main():

    print()
    print("=== SANARISTIGENERAATTORI V4 ===")
    print()

    start = time.time()

    words = load_words()

    print(
        f"Sanoja: {len(words)}"
    )

    exact, prefix = build_index(words)

    print(
        f"Erilaisia keskiosia: "
        f"{len(exact)}"
    )

    print()
    print(
        f"Tavoite: {PUZZLES_TO_GENERATE} sanaristiä"
    )

    print()

    puzzles = []

    used_grids = set()

    attempts = 0

    while len(puzzles) < PUZZLES_TO_GENERATE:

        attempts += 1

        puzzle = generate_one(
            words,
            exact,
            prefix
        )

        if puzzle is None:
            print(
                f"[{len(puzzles) + 1}/"
                f"{PUZZLES_TO_GENERATE}] "
                f"Ei kelvollista ristikkoa "
                f"(yritys {attempts})"
            )
            continue

        grid_key = tuple(
            middle(word)
            for word in puzzle["horizontal"]
        )

        if grid_key in used_grids:
            continue

        used_grids.add(grid_key)

        horizontal = puzzle["horizontal"]
        vertical = puzzle["vertical"]

        grid = build_grid(
            horizontal,
            vertical
        )

        puzzle_data = {
            "id": len(puzzles) + 1,
            "grid": grid,
            "horizontal": horizontal,
            "vertical": vertical
        }

        puzzles.append(puzzle_data)

        print(
            f"[{len(puzzles)}/"
            f"{PUZZLES_TO_GENERATE}] OK"
        )

        print_puzzle(puzzle)

    # --------------------------------------------------------
    # TALLENNUS
    # --------------------------------------------------------

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            puzzles,
            file,
            ensure_ascii=False,
            indent=2
        )

    elapsed = time.time() - start

    print("========================================")
    print(
        f"Valmiita sanaristejä: {len(puzzles)}"
    )
    print(
        f"Yrityksiä: {attempts}"
    )
    print(
        f"Aikaa: {elapsed:.2f} s"
    )
    print(
        f"Tallennettu: {OUTPUT_FILE}"
    )
    print("========================================")


if __name__ == "__main__":
    main()
