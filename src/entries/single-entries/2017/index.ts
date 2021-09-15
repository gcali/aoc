import { embedAll } from "../../embeddedData";
import { aMazeOfTwistyTrampolinesAllAlike } from "./a-maze-of-twisty-trampolines-all-alike";
import { aSeriesOfTubes } from "./a-series-of-tubes";
import { coprocessorConflagration } from "./coprocessor-conflagration";
import { corruptionChecksum } from "./corruption-checksum";
import { digitalPlumber } from "./digital-plumber";
import { diskDefragmentation } from "./disk-defragmentation";
import { duelingGenerators } from "./dueling-generators";
import { duet } from "./duet";
import { electromagneticMoat } from "./electromagnetic-moat";
import { fractalArt } from "./fractal-art";
import { heardYouLikeRegisters } from "./heard-you-like-registers";
import { hexEd } from "./hex-ed";
import { highEntropyPasshprases } from "./high-entropy-passhprases";
import { inverseCaptcha } from "./inverse-captcha";
import { knotHash } from "./knot-hash";
import { memoryReallocation } from "./memory-reallocation";
import { packetScanners } from "./packet-scanners";
import { particleSwarm } from "./particle-swarm";
import { permutationPromenade } from "./permutation-promenade";
import { recursiveCircus } from "./recursive-circus";
import { spinlock } from "./spinlock";
import { spiralMemory } from "./spiral-memory";
import { sporificaVirus } from "./sporifica-virus";
import { streamProcessing } from "./stream-processing";
import { haltingProblem } from "./the-halting-problem";

export const entries =
    embedAll([
        inverseCaptcha,
        corruptionChecksum,
        spiralMemory,
        highEntropyPasshprases,
        aMazeOfTwistyTrampolinesAllAlike,
        memoryReallocation,
        recursiveCircus,
        heardYouLikeRegisters,
        streamProcessing,
        knotHash,
        hexEd,
        digitalPlumber,
        packetScanners,
        diskDefragmentation,
        duelingGenerators,
        permutationPromenade,
        spinlock,
        duet,
        aSeriesOfTubes,
        particleSwarm,
        fractalArt,
        sporificaVirus,
        coprocessorConflagration,
        electromagneticMoat,
        haltingProblem,
    ])
;
