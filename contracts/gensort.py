# v.0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


BOTTLE_HEIGHT = 4
MAX_LEADERBOARD_SIZE = 100
MAX_HISTORY_SIZE = 250


# ─────────────────────────────────────────────────────────────────────────────
# JSON helpers
# ─────────────────────────────────────────────────────────────────────────────

def _loads(raw: str, fallback):
    if raw == "":
        return fallback
    try:
        return json.loads(raw)
    except Exception:
        return fallback


def _dumps(value) -> str:
    return json.dumps(value, separators=(",", ":"), sort_keys=True)


# ─────────────────────────────────────────────────────────────────────────────
# Game helpers
# Bottle format:
# [
#   ["red", "blue", "blue", "green"],
#   ["green", "red"],
#   []
# ]
#
# The end of each bottle list is the top of the bottle.
# ─────────────────────────────────────────────────────────────────────────────

def _copy_bottles(bottles: list) -> list:
    copied = []
    for bottle in bottles:
        copied.append(list(bottle))
    return copied


def _validate_bottles(bottles: list):
    if len(bottles) == 0:
        raise Exception("Bottle layout cannot be empty")

    for bottle in bottles:
        if len(bottle) > BOTTLE_HEIGHT:
            raise Exception("Bottle exceeds maximum height")

        for colour in bottle:
            if str(colour).strip() == "":
                raise Exception("Bottle colour cannot be empty")


def _can_pour(from_bottle: list, to_bottle: list) -> bool:
    if len(from_bottle) == 0:
        return False

    if len(to_bottle) >= BOTTLE_HEIGHT:
        return False

    if len(to_bottle) == 0:
        return True

    return from_bottle[len(from_bottle) - 1] == to_bottle[len(to_bottle) - 1]


def _top_colour_count(bottle: list) -> int:
    if len(bottle) == 0:
        return 0

    colour = bottle[len(bottle) - 1]
    count = 0

    for i in range(len(bottle) - 1, -1, -1):
        if bottle[i] == colour:
            count += 1
        else:
            break

    return count


def _apply_pour(bottles: list, from_idx: int, to_idx: int) -> list:
    copied = _copy_bottles(bottles)

    from_bottle = copied[from_idx]
    to_bottle = copied[to_idx]

    if not _can_pour(from_bottle, to_bottle):
        raise Exception("Illegal pour")

    colour = from_bottle[len(from_bottle) - 1]
    movable = _top_colour_count(from_bottle)
    space = BOTTLE_HEIGHT - len(to_bottle)

    amount = movable
    if space < amount:
        amount = space

    copied[from_idx] = from_bottle[: len(from_bottle) - amount]
    copied[to_idx] = to_bottle + ([colour] * amount)

    return copied


def _is_solved(bottles: list) -> bool:
    for bottle in bottles:
        if len(bottle) == 0:
            continue

        if len(bottle) != BOTTLE_HEIGHT:
            return False

        first = bottle[0]
        for colour in bottle:
            if colour != first:
                return False

    return True


def _score(moves: int, time_seconds: int) -> int:
    value = 100000 - (moves * 100) - time_seconds
    if value < 0:
        return 0
    return value


def _default_player(username: str):
    return {
        "username": username,
        "completed_levels": [],
        "best_scores": {},
        "total_completed": 0,
        "achievements": [],
        "undo_count": 0,
        "restart_count": 0,
        "last_played": 0,
    }


def _default_session(address: str, puzzle_id: str, layout: list):
    return {
        "address": address,
        "puzzle_id": puzzle_id,
        "initial_state": _copy_bottles(layout),
        "current_state": _copy_bottles(layout),
        "history": [],
        "moves": 0,
        "started": True,
        "solved": False,
        "completed": False,
    }


def _empty_leaderboard():
    return []


def _session_key(address: str, puzzle_id: str) -> str:
    return address + "::" + puzzle_id


# ─────────────────────────────────────────────────────────────────────────────
# Contract
# ─────────────────────────────────────────────────────────────────────────────

class GenSort(gl.Contract):
    # puzzle_id -> JSON puzzle object
    puzzles: TreeMap[str, str]

    # address string -> JSON player object
    players: TreeMap[str, str]

    # address::puzzle_id -> JSON session object
    sessions: TreeMap[str, str]

    # puzzle_id -> JSON list of leaderboard entries
    leaderboards: TreeMap[str, str]

    # address string -> JSON int total score
    global_scores: TreeMap[str, str]

    puzzle_count: u256

    def __init__(self):
        self.puzzle_count = u256(0)

    # ─────────────────────────────────────────────────────────────────────
    # Internal storage helpers
    # ─────────────────────────────────────────────────────────────────────

    def _get_puzzle(self, puzzle_id: str):
        return _loads(self.puzzles.get(puzzle_id, ""), {})

    def _set_puzzle(self, puzzle_id: str, puzzle):
        self.puzzles[puzzle_id] = _dumps(puzzle)

    def _get_player(self, address: str):
        return _loads(self.players.get(address, ""), {})

    def _set_player(self, address: str, player):
        self.players[address] = _dumps(player)

    def _get_or_create_player(self, address: str):
        player = self._get_player(address)
        if player == {}:
            player = _default_player("Anonymous")
            self._set_player(address, player)
        return player

    def _get_session(self, address: str, puzzle_id: str):
        key = _session_key(address, puzzle_id)
        return _loads(self.sessions.get(key, ""), {})

    def _set_session(self, address: str, puzzle_id: str, session):
        key = _session_key(address, puzzle_id)
        self.sessions[key] = _dumps(session)

    def _get_leaderboard(self, puzzle_id: str):
        return _loads(self.leaderboards.get(puzzle_id, ""), _empty_leaderboard())

    def _set_leaderboard(self, puzzle_id: str, leaderboard):
        self.leaderboards[puzzle_id] = _dumps(leaderboard)

    def _get_global_score(self, address: str) -> int:
        raw = self.global_scores.get(address, "")
        if raw == "":
            return 0
        try:
            return int(raw)
        except Exception:
            return 0

    def _set_global_score(self, address: str, score: int):
        self.global_scores[address] = str(score)

    # ─────────────────────────────────────────────────────────────────────
    # Admin / setup
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.write
    def store_puzzle(
        self,
        puzzle_id: str,
        layout: list,
        difficulty: str,
        seed: str,
        level: int,
    ) -> dict:
        if puzzle_id == "":
            raise Exception("Puzzle id cannot be empty")

        bottles = _copy_bottles(layout)
        _validate_bottles(bottles)

        existed = self.puzzles.get(puzzle_id, "") != ""

        puzzle = {
            "puzzle_id": puzzle_id,
            "layout": bottles,
            "difficulty": difficulty,
            "seed": seed,
            "level": level,
        }

        self._set_puzzle(puzzle_id, puzzle)

        if not existed:
            self.puzzle_count = self.puzzle_count + u256(1)

        return {
            "ok": True,
            "puzzle_id": puzzle_id,
            "existed": existed,
            "puzzle_count": str(self.puzzle_count),
        }

    @gl.public.write
    def store_many_puzzles(self, puzzles: list) -> dict:
        added = 0
        updated = 0

        for item in puzzles:
            puzzle_id = item.get("puzzle_id", "")
            layout = item.get("layout", [])
            difficulty = item.get("difficulty", "")
            seed = item.get("seed", "")
            level = int(item.get("level", 0))

            if puzzle_id == "":
                raise Exception("Puzzle id cannot be empty")

            bottles = _copy_bottles(layout)
            _validate_bottles(bottles)

            existed = self.puzzles.get(puzzle_id, "") != ""

            puzzle = {
                "puzzle_id": puzzle_id,
                "layout": bottles,
                "difficulty": difficulty,
                "seed": seed,
                "level": level,
            }

            self._set_puzzle(puzzle_id, puzzle)

            if existed:
                updated += 1
            else:
                added += 1
                self.puzzle_count = self.puzzle_count + u256(1)

        return {
            "ok": True,
            "added": added,
            "updated": updated,
            "puzzle_count": str(self.puzzle_count),
        }

    # ─────────────────────────────────────────────────────────────────────
    # Player management
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.write
    def register_player(self, username: str) -> dict:
        address = str(gl.message.sender_address)

        clean_username = username.strip()
        if clean_username == "":
            clean_username = "Anonymous"
        else:
            # Feature 5: LLM-moderated username via GenLayer consensus.
            # Validators independently ask the LLM whether the name is acceptable;
            # only "OK" with equivalent responses passes consensus.
            def _moderate() -> str:
                task = (
                    "You are moderating a username for a public game leaderboard. "
                    "Username: \"" + clean_username + "\". "
                    "Reply with exactly one word: OK if it is non-offensive, non-impersonating, "
                    "and contains no slurs/hate/sexual content. Otherwise reply REJECT."
                )
                return gl.nondet.exec_prompt(task).strip().upper()

            verdict = gl.eq_principle.prompt_comparative(
                _moderate,
                "Both responses must agree on whether the username is OK or REJECT.",
            )
            if "REJECT" in verdict:
                raise Exception("Username rejected by moderation consensus")

        player = self._get_player(address)

        if player == {}:
            player = _default_player(clean_username)
        else:
            player["username"] = clean_username

        self._set_player(address, player)

        return {
            "ok": True,
            "address": address,
            "username": clean_username,
        }

    @gl.public.view
    def get_player_state(self, player_address: str) -> dict:
        return self._get_player(player_address)

    # ─────────────────────────────────────────────────────────────────────
    # Puzzle session flow
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.write
    def start_puzzle(
        self,
        puzzle_id: str,
        fallback_layout: list = [],
        difficulty: str = "",
        seed: str = "",
        level: int = 0,
    ) -> dict:
        address = str(gl.message.sender_address)

        if puzzle_id == "":
            raise Exception("Puzzle id cannot be empty")

        self._get_or_create_player(address)

        puzzle = self._get_puzzle(puzzle_id)

        if puzzle == {}:
            if len(fallback_layout) == 0:
                raise Exception("Puzzle not found and no fallback layout provided")

            bottles = _copy_bottles(fallback_layout)
            _validate_bottles(bottles)

            puzzle = {
                "puzzle_id": puzzle_id,
                "layout": bottles,
                "difficulty": difficulty,
                "seed": seed,
                "level": level,
            }

            self._set_puzzle(puzzle_id, puzzle)
            self.puzzle_count = self.puzzle_count + u256(1)
        else:
            bottles = _copy_bottles(puzzle.get("layout", []))
            _validate_bottles(bottles)

        session = _default_session(address, puzzle_id, bottles)
        self._set_session(address, puzzle_id, session)

        return {
            "ok": True,
            "puzzle_id": puzzle_id,
            "bottles": bottles,
            "moves": 0,
            "solved": False,
            "session_started": True,
        }

    @gl.public.view
    def get_session(self, player_address: str, puzzle_id: str) -> dict:
        return self._get_session(player_address, puzzle_id)

    @gl.public.view
    def get_my_session(self, puzzle_id: str) -> dict:
        address = str(gl.message.sender_address)
        return self._get_session(address, puzzle_id)

    # ─────────────────────────────────────────────────────────────────────
    # Move validation
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.write
    def submit_move(
        self,
        puzzle_id: str,
        from_bottle: int,
        to_bottle: int,
    ) -> dict:
        address = str(gl.message.sender_address)

        if puzzle_id == "":
            raise Exception("Puzzle id cannot be empty")

        session = self._get_session(address, puzzle_id)

        if session == {}:
            raise Exception("Puzzle session not started")

        if bool(session.get("completed", False)):
            raise Exception("Puzzle already completed")

        bottles = _copy_bottles(session.get("current_state", []))
        _validate_bottles(bottles)

        if from_bottle < 0 or from_bottle >= len(bottles):
            raise Exception("Invalid from_bottle index")

        if to_bottle < 0 or to_bottle >= len(bottles):
            raise Exception("Invalid to_bottle index")

        if from_bottle == to_bottle:
            raise Exception("Cannot pour into the same bottle")

        if not _can_pour(bottles[from_bottle], bottles[to_bottle]):
            raise Exception("Illegal pour: colour mismatch, empty source, or full target")

        history = list(session.get("history", []))
        history.append({
            "from_bottle": from_bottle,
            "to_bottle": to_bottle,
            "before": bottles,
        })

        if len(history) > MAX_HISTORY_SIZE:
            history = history[len(history) - MAX_HISTORY_SIZE:]

        new_bottles = _apply_pour(bottles, from_bottle, to_bottle)
        solved = _is_solved(new_bottles)

        moves = int(session.get("moves", 0)) + 1

        session["current_state"] = new_bottles
        session["history"] = history
        session["moves"] = moves
        session["solved"] = solved

        self._set_session(address, puzzle_id, session)

        return {
            "ok": True,
            "puzzle_id": puzzle_id,
            "from_bottle": from_bottle,
            "to_bottle": to_bottle,
            "bottles": new_bottles,
            "moves": moves,
            "solved": solved,
        }

    # ─────────────────────────────────────────────────────────────────────
    # Undo / restart tracking
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.write
    def undo_move(self, puzzle_id: str) -> dict:
        address = str(gl.message.sender_address)

        session = self._get_session(address, puzzle_id)
        if session == {}:
            raise Exception("Puzzle session not started")

        if bool(session.get("completed", False)):
            raise Exception("Cannot undo completed puzzle")

        history = list(session.get("history", []))

        if len(history) == 0:
            raise Exception("No move to undo")

        last = history[len(history) - 1]
        history = history[: len(history) - 1]

        previous_state = _copy_bottles(last.get("before", []))
        _validate_bottles(previous_state)

        moves = int(session.get("moves", 0))
        if moves > 0:
            moves = moves - 1

        session["current_state"] = previous_state
        session["history"] = history
        session["moves"] = moves
        session["solved"] = _is_solved(previous_state)

        self._set_session(address, puzzle_id, session)

        player = self._get_or_create_player(address)
        player["undo_count"] = int(player.get("undo_count", 0)) + 1

        achievements = list(player.get("achievements", []))
        if player["undo_count"] >= 10 and "undo_master" not in achievements:
            achievements.append("undo_master")

        player["achievements"] = achievements
        self._set_player(address, player)

        return {
            "ok": True,
            "puzzle_id": puzzle_id,
            "bottles": previous_state,
            "moves": moves,
            "undo_count": player["undo_count"],
            "solved": session["solved"],
        }

    @gl.public.write
    def restart_puzzle(self, puzzle_id: str) -> dict:
        address = str(gl.message.sender_address)

        session = self._get_session(address, puzzle_id)
        if session == {}:
            raise Exception("Puzzle session not started")

        initial_state = _copy_bottles(session.get("initial_state", []))
        _validate_bottles(initial_state)

        session["current_state"] = initial_state
        session["history"] = []
        session["moves"] = 0
        session["solved"] = False
        session["completed"] = False

        self._set_session(address, puzzle_id, session)

        player = self._get_or_create_player(address)
        player["restart_count"] = int(player.get("restart_count", 0)) + 1
        self._set_player(address, player)

        return {
            "ok": True,
            "puzzle_id": puzzle_id,
            "bottles": initial_state,
            "moves": 0,
            "restart_count": player["restart_count"],
        }

    # ─────────────────────────────────────────────────────────────────────
    # Puzzle completion
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.write
    def complete_level(
        self,
        puzzle_id: str,
        time_seconds: int,
        difficulty: str,
    ) -> dict:
        address = str(gl.message.sender_address)

        if puzzle_id == "":
            raise Exception("Puzzle id cannot be empty")

        if time_seconds < 0:
            raise Exception("Time cannot be negative")

        session = self._get_session(address, puzzle_id)
        if session == {}:
            raise Exception("Puzzle session not started")

        if bool(session.get("completed", False)):
            raise Exception("Puzzle already completed")

        final_state = _copy_bottles(session.get("current_state", []))
        _validate_bottles(final_state)

        if not _is_solved(final_state):
            raise Exception("Level is not solved")

        moves = int(session.get("moves", 0))

        player = self._get_or_create_player(address)

        previous_achievements = list(player.get("achievements", []))
        computed_score = _score(moves, time_seconds)

        best_scores = player.get("best_scores", {})
        existing_best = best_scores.get(puzzle_id)

        is_best = False
        if existing_best is None:
            is_best = True
        elif moves < int(existing_best.get("moves", 999999999)):
            is_best = True
        elif moves == int(existing_best.get("moves", 999999999)) and time_seconds < int(existing_best.get("time_seconds", 999999999)):
            is_best = True

        if is_best:
            best_scores[puzzle_id] = {
                "moves": moves,
                "time_seconds": time_seconds,
                "score": computed_score,
            }

        completed_levels = player.get("completed_levels", [])
        if puzzle_id not in completed_levels:
            completed_levels.append(puzzle_id)
            player["total_completed"] = int(player.get("total_completed", 0)) + 1

        player["completed_levels"] = completed_levels
        player["best_scores"] = best_scores

        total_score = self._get_global_score(address)
        if is_best:
            if existing_best is None:
                total_score = total_score + computed_score
            else:
                total_score = total_score - int(existing_best.get("score", 0)) + computed_score
            self._set_global_score(address, total_score)

        leaderboard = self._get_leaderboard(puzzle_id)

        filtered = []
        for entry in leaderboard:
            if entry.get("address", "") != address:
                filtered.append(entry)

        filtered.append({
            "address": address,
            "username": player.get("username", "Anonymous"),
            "moves": moves,
            "time_seconds": time_seconds,
            "score": computed_score,
        })

        filtered.sort(
            key=lambda entry: (
                -int(entry.get("score", 0)),
                int(entry.get("moves", 999999999)),
                int(entry.get("time_seconds", 999999999)),
            )
        )

        self._set_leaderboard(puzzle_id, filtered[:MAX_LEADERBOARD_SIZE])

        achievements = list(player.get("achievements", []))
        total_completed = int(player.get("total_completed", 0))

        if "first_solve" not in achievements:
            achievements.append("first_solve")

        if total_completed >= 10 and "ten_solves" not in achievements:
            achievements.append("ten_solves")

        if total_completed >= 100 and "century" not in achievements:
            achievements.append("century")

        if time_seconds < 60 and "speed_demon" not in achievements:
            achievements.append("speed_demon")

        if difficulty == "hard" and "hard_solver" not in achievements:
            achievements.append("hard_solver")

        player["achievements"] = achievements
        self._set_player(address, player)

        session["completed"] = True
        session["solved"] = True
        self._set_session(address, puzzle_id, session)

        earned = []
        for achievement in achievements:
            if achievement not in previous_achievements:
                earned.append(achievement)

        return {
            "ok": True,
            "puzzle_id": puzzle_id,
            "moves": moves,
            "time_seconds": time_seconds,
            "score": computed_score,
            "total_score": total_score,
            "is_best": is_best,
            "achievements_earned": earned,
        }

    # ─────────────────────────────────────────────────────────────────────
    # Leaderboards
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_leaderboard(self, puzzle_id: str, limit: int = 20) -> list:
        leaderboard = self._get_leaderboard(puzzle_id)

        if limit < 0:
            limit = 0

        if limit > MAX_LEADERBOARD_SIZE:
            limit = MAX_LEADERBOARD_SIZE

        return leaderboard[:limit]

    @gl.public.view
    def get_global_score(self, player_address: str) -> int:
        return self._get_global_score(player_address)

    @gl.public.view
    def get_global_leaderboard(self, addresses: list, limit: int = 50) -> list:
        entries = []

        for address in addresses:
            score = self._get_global_score(address)
            player = self._get_player(address)

            if player != {} or score > 0:
                entries.append({
                    "address": address,
                    "username": player.get("username", "Anonymous"),
                    "score": score,
                    "total_completed": player.get("total_completed", 0),
                })

        entries.sort(key=lambda entry: -int(entry.get("score", 0)))

        if limit < 0:
            limit = 0

        return entries[:limit]

    # ─────────────────────────────────────────────────────────────────────
    # GenLayer non-deterministic features (LLM + web)
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.write
    def generate_puzzle(
        self,
        puzzle_id: str,
        difficulty: str,
        theme: str = "",
        num_colours: int = 3,
    ) -> dict:
        """
        Feature 1 + 2: LLM-generated puzzle with on-chain solvability/difficulty
        check, both validated via GenLayer equivalence-principle consensus.
        """
        if puzzle_id == "":
            raise Exception("Puzzle id cannot be empty")
        if self.puzzles.get(puzzle_id, "") != "":
            raise Exception("Puzzle id already exists")

        difficulty_clean = difficulty.strip().lower() or "easy"
        theme_clean = theme.strip() or "classic"
        nc = max(2, min(int(num_colours), 6))

        prompt = (
            "You generate water-sort puzzles. Bottle height is " + str(BOTTLE_HEIGHT) + ". "
            "Produce a JSON object with keys: layout (list of bottles, each bottle is a "
            "list of colour strings from bottom to top, max " + str(BOTTLE_HEIGHT) + " items; "
            "include 2 empty bottles), solvable (bool), difficulty_rating (1-10 int), "
            "estimated_min_moves (int). Use exactly " + str(nc) + " distinct colours, each "
            "appearing exactly " + str(BOTTLE_HEIGHT) + " times. Difficulty: " + difficulty_clean
            + ". Theme: " + theme_clean + ". Return ONLY the JSON, no prose."
        )

        def _gen() -> str:
            return gl.nondet.exec_prompt(prompt)

        raw = gl.eq_principle.prompt_comparative(
            _gen,
            "Both responses must describe puzzles with the same colour multiset, same "
            "number of bottles, the same solvable flag, and difficulty_rating within 2 of "
            "each other.",
        )

        data = _loads(raw.strip().strip("`"), {})
        if data == {}:
            raise Exception("LLM did not return valid JSON")

        layout = data.get("layout", [])
        if not bool(data.get("solvable", False)):
            raise Exception("LLM marked the generated puzzle as unsolvable")

        bottles = _copy_bottles(layout)
        _validate_bottles(bottles)

        puzzle = {
            "puzzle_id": puzzle_id,
            "layout": bottles,
            "difficulty": difficulty_clean,
            "seed": "llm",
            "level": 0,
            "theme": theme_clean,
            "ai_generated": True,
            "ai_difficulty_rating": int(data.get("difficulty_rating", 5)),
            "ai_min_moves": int(data.get("estimated_min_moves", 0)),
        }
        self._set_puzzle(puzzle_id, puzzle)
        self.puzzle_count = self.puzzle_count + u256(1)

        return {"ok": True, "puzzle_id": puzzle_id, "puzzle": puzzle}

    @gl.public.write
    def get_hint(self, puzzle_id: str) -> dict:
        """
        Feature 3: LLM suggests the next-best legal pour. Validators must agree
        the suggested move is legal under the current session state.
        """
        address = str(gl.message.sender_address)
        session = self._get_session(address, puzzle_id)
        if session == {}:
            raise Exception("Puzzle session not started")

        bottles = _copy_bottles(session.get("current_state", []))

        prompt = (
            "You are solving a water-sort puzzle. Bottle height is " + str(BOTTLE_HEIGHT) + ". "
            "Current state (each bottle is bottom-to-top): " + _dumps(bottles) + ". "
            "Reply with ONLY a JSON object {\"from\": <int>, \"to\": <int>} for the next "
            "best legal pour. A pour is legal if the source is non-empty, the target is "
            "not full, and either the target is empty or its top colour matches the "
            "source top colour."
        )

        def _hint() -> str:
            return gl.nondet.exec_prompt(prompt)

        raw = gl.eq_principle.prompt_comparative(
            _hint,
            "Both responses must propose the same (from, to) pour, and that pour must be "
            "legal for the given bottle state.",
        )

        move = _loads(raw.strip().strip("`"), {})
        from_idx = int(move.get("from", -1))
        to_idx = int(move.get("to", -1))

        if from_idx < 0 or from_idx >= len(bottles) or to_idx < 0 or to_idx >= len(bottles):
            raise Exception("Hint produced out-of-range bottle indices")
        if from_idx == to_idx or not _can_pour(bottles[from_idx], bottles[to_idx]):
            raise Exception("Hint produced an illegal pour")

        return {"ok": True, "from_bottle": from_idx, "to_bottle": to_idx}

    @gl.public.write
    def start_daily_challenge(self, date_url: str) -> dict:
        """
        Feature 4: Daily challenge seeded from an external web source so every
        player worldwide gets the same puzzle without a trusted admin push.
        Validators fetch the URL via gl.nondet.web and must agree on the seed.
        """
        def _fetch() -> str:
            return gl.nondet.web.render(date_url, mode="text")

        page = gl.eq_principle.prompt_comparative(
            _fetch,
            "Both fetched bodies must contain the same date string (YYYY-MM-DD).",
        )

        # Extract first YYYY-MM-DD-looking token deterministically.
        date_str = ""
        for i in range(len(page) - 9):
            chunk = page[i:i + 10]
            if (
                len(chunk) == 10
                and chunk[4] == "-" and chunk[7] == "-"
                and chunk[:4].isdigit() and chunk[5:7].isdigit() and chunk[8:10].isdigit()
            ):
                date_str = chunk
                break
        if date_str == "":
            raise Exception("Could not extract a date from the web source")

        puzzle_id = "daily-" + date_str
        if self.puzzles.get(puzzle_id, "") != "":
            return {"ok": True, "puzzle_id": puzzle_id, "existed": True}

        # Generate the daily puzzle via LLM (reuses Feature 1).
        return self.generate_puzzle(puzzle_id=puzzle_id, difficulty="medium", theme="daily", num_colours=4)

    # ─────────────────────────────────────────────────────────────────────
    # Puzzle retrieval
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_puzzle(self, puzzle_id: str) -> dict:
        return self._get_puzzle(puzzle_id)

    @gl.public.view
    def puzzle_exists(self, puzzle_id: str) -> bool:
        return self.puzzles.get(puzzle_id, "") != ""

    @gl.public.view
    def get_puzzle_count(self) -> str:
        return str(self.puzzle_count)

    # ─────────────────────────────────────────────────────────────────────
    # Daily challenge stats
    # ─────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_daily_stats(self, date_str: str) -> dict:
        puzzle_id = "daily-" + date_str
        leaderboard = self._get_leaderboard(puzzle_id)

        best_moves = 0
        best_time = 0

        if len(leaderboard) > 0:
            best_moves = int(leaderboard[0].get("moves", 0))
            best_time = int(leaderboard[0].get("time_seconds", 0))

            for entry in leaderboard:
                moves = int(entry.get("moves", 0))
                time_seconds = int(entry.get("time_seconds", 0))

                if moves < best_moves:
                    best_moves = moves

                if time_seconds < best_time:
                    best_time = time_seconds

        return {
            "puzzle_id": puzzle_id,
            "total_completions": len(leaderboard),
            "best_moves": best_moves,
            "best_time": best_time,
        }