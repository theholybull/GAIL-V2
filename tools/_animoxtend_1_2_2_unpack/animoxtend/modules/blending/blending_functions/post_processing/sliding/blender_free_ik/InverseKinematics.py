import logging

import numpy as np
import scipy.linalg as linalg

from . import Animation, AnimationStructure
from .Quaternions_old import Quaternions

logger = logging.getLogger("animoxtend")


class JacobianInverseKinematics:
    """
    Jacobian Based Full Body IK Solver

    This is a full body IK solver which
    uses the dampened least squares inverse
    jacobian method.

    It should remain fairly stable and effective
    even for joint positions which are out of
    reach and it can also take any number of targets
    to treat as end effectors.

    Parameters
    ----------

    animation : Animation
        animation to solve inverse problem on

    targets : {int : (F, 3) ndarray}
        Dictionary of target positions for each
        frame F, mapping joint index to
        a target position

    references : (F, 3)
        Optional list of J joint position
        references for which the result
        should bias toward

    iterations : int
        Optional number of iterations to
        compute. More iterations results in
        better accuracy but takes longer to
        compute. Default is 10.

    recalculate : bool
        Optional if to recalcuate jacobian
        each iteration. Gives better accuracy
        but slower to compute. Defaults to True

    damping : float
        Optional damping constant. Higher
        damping increases stability but
        requires more iterations to converge.
        Defaults to 5.0

    secondary : float
        Force, or bias toward secondary target.
        Defaults to 0.25

    silent : bool
        Optional if to suppress output
        defaults to False
    """

    def __init__(
        self,
        animation,
        targets,
        references=None,
        iterations=10,
        recalculate=True,
        damping=2.0,
        secondary=0.25,
        translate=False,
        silent=False,
        weights=None,
        weights_translate=None,
        tolerance=5e-4,
    ):
        self.animation = animation
        self.targets = targets
        self.references = references

        self.iterations = iterations
        self.recalculate = recalculate
        self.damping = damping
        self.secondary = secondary
        self.translate = translate
        self.silent = silent
        self.weights = weights
        self.weights_translate = weights_translate
        self.tolerance = tolerance

    def cross(self, a, b):
        o = np.empty(b.shape)
        o[..., 0] = a[..., 1] * b[..., 2] - a[..., 2] * b[..., 1]
        o[..., 1] = a[..., 2] * b[..., 0] - a[..., 0] * b[..., 2]
        o[..., 2] = a[..., 0] * b[..., 1] - a[..., 1] * b[..., 0]
        return o

    def jacobian(self, x, fp, fr, ts, dsc, tdsc):
        """Find parent rotations"""
        prs = fr[:, self.animation.parents]
        prs[:, 0] = Quaternions.id((1))

        """ Find global positions of target joints """
        tps = fp[:, np.array(list(ts.keys()))]

        """ Get partial rotations """
        qys = Quaternions.from_angle_axis(x[:, 1 : prs.shape[1] * 3 : 3], np.array([[[0, 1, 0]]]))
        qzs = Quaternions.from_angle_axis(x[:, 2 : prs.shape[1] * 3 : 3], np.array([[[0, 0, 1]]]))

        """ Find axis of rotations """
        es = np.empty((len(x), fr.shape[1] * 3, 3))
        es[:, 0::3] = ((prs * qzs) * qys) * np.array([[[1, 0, 0]]])
        es[:, 1::3] = (prs * qzs) * np.array([[[0, 1, 0]]])
        es[:, 2::3] = prs * np.array([[[0, 0, 1]]])

        """ Construct Jacobian """
        j = fp.repeat(3, axis=1)
        j = dsc[np.newaxis, :, :, np.newaxis] * (tps[:, np.newaxis, :] - j[:, :, np.newaxis])
        j = self.cross(es[:, :, np.newaxis, :], j)
        j = np.swapaxes(j.reshape((len(x), fr.shape[1] * 3, len(ts) * 3)), 1, 2)

        if self.translate:
            es = np.empty((len(x), fr.shape[1] * 3, 3))
            es[:, 0::3] = prs * np.array([[[1, 0, 0]]])
            es[:, 1::3] = prs * np.array([[[0, 1, 0]]])
            es[:, 2::3] = prs * np.array([[[0, 0, 1]]])

            jt = tdsc[np.newaxis, :, :, np.newaxis] * es[:, :, np.newaxis, :].repeat(tps.shape[1], axis=2)
            jt = np.swapaxes(jt.reshape((len(x), fr.shape[1] * 3, len(ts) * 3)), 1, 2)

            j = np.concatenate([j, jt], axis=-1)

        return j

    # @profile(immediate=True)
    def __call__(self, descendants=None, gamma=1.0):
        self.descendants = descendants

        """ Calculate Masses """
        if self.weights is None:
            self.weights = np.ones(self.animation.shape[1])

        if self.weights_translate is None:
            self.weights_translate = np.ones(self.animation.shape[1])

        """ Calculate Descendants """
        if self.descendants is None:
            self.descendants = AnimationStructure.descendants_mask(self.animation.parents)

        self.tdescendants = np.eye(self.animation.shape[1]) + self.descendants

        self.first_descendants = self.descendants[:, np.array(list(self.targets.keys()))].repeat(3, axis=0).astype(int)
        self.first_tdescendants = (
            self.tdescendants[:, np.array(list(self.targets.keys()))].repeat(3, axis=0).astype(int)
        )

        """ Calculate End Effectors """
        self.endeff = np.array(list(self.targets.values()))
        self.endeff = np.swapaxes(self.endeff, 0, 1)

        if self.references is not None:
            self.second_descendants = self.descendants.repeat(3, axis=0).astype(int)
            self.second_tdescendants = self.tdescendants.repeat(3, axis=0).astype(int)
            self.second_targets = dict([(i, self.references[:, i]) for i in range(self.references.shape[1])])

        nf = len(self.animation)
        nj = self.animation.shape[1]

        if not self.silent:
            gp = Animation.positions_global(self.animation)
            gp = gp[:, np.array(list(self.targets.keys()))]
            error = np.mean(np.sqrt(np.sum((self.endeff - gp) ** 2.0, axis=2)))
            logger.debug("[JacobianInverseKinematics] Start | Error: %s", error)

        for i in range(self.iterations):
            """Get Global Rotations & Positions"""
            gt = Animation.transforms_global(self.animation)
            gp = gt[:, :, :, 3]
            gp = gp[:, :, :3] / gp[:, :, 3, np.newaxis]
            gr = Quaternions.from_transforms(gt)

            x = self.animation.rotations.euler().reshape(nf, -1)
            if len(self.weights.shape) == 1:
                w = self.weights.repeat(3)
            else:
                w = self.weights.reshape(-1, 1)[:, 0]

            if self.translate:
                x = np.hstack([x, self.animation.positions.reshape(nf, -1)])
                w = np.hstack([w, self.weights_translate.repeat(3)])

            """ Generate Jacobian """
            if self.recalculate or i == 0:
                j = self.jacobian(
                    x,
                    gp,
                    gr,
                    self.targets,
                    self.first_descendants,
                    self.first_tdescendants,
                )

            """ Update Variables """
            lr = self.damping * (1.0 / (w + 0.001))
            d = (lr * lr) * np.eye(x.shape[1])
            e = gamma * (self.endeff.reshape(nf, -1) - gp[:, np.array(list(self.targets.keys()))].reshape(nf, -1))

            delta = np.array(
                list(
                    map(
                        lambda jf, ef: linalg.lu_solve(linalg.lu_factor(jf.T.dot(jf) + d), jf.T.dot(ef)),
                        j,
                        e,
                    )
                )
            )

            x += delta

            """ Generate Secondary Jacobian """
            if self.references is not None:
                ns = np.array(
                    list(
                        map(
                            lambda jf: np.eye(x.shape[1]) - linalg.solve(jf.T.dot(jf) + d, jf.T.dot(jf)),
                            j,
                        )
                    )
                )

                if self.recalculate or i == 0:
                    j2 = self.jacobian(
                        x,
                        gp,
                        gr,
                        self.second_targets,
                        self.second_descendants,
                        self.second_tdescendants,
                    )

                e2 = self.secondary * (self.references.reshape(nf, -1) - gp.reshape(nf, -1))

                delta_sec = np.array(
                    list(
                        map(
                            lambda nsf, j2f, e2f: nsf.dot(
                                linalg.lu_solve(linalg.lu_factor(j2f.T.dot(j2f) + d), j2f.T.dot(e2f))
                            ),
                            ns,
                            j2,
                            e2,
                        )
                    )
                )
                x += delta_sec

            """ Set Back Rotations / Translations """
            self.animation.rotations = Quaternions.from_euler(
                x[:, : nj * 3].reshape((nf, nj, 3)), order="xyz", world=True
            )

            if self.translate:
                self.animation.positions = x[:, nj * 3 :].reshape((nf, nj, 3))

            """ Generate Error """

            if not self.silent:
                gp = Animation.positions_global(self.animation)
                gp = gp[:, np.array(list(self.targets.keys()))]
                error = np.mean(np.sum((self.endeff - gp) ** 2.0, axis=2) ** 0.5)

                if error < self.tolerance:
                    logger.debug("[JacobianInverseKinematics] Iteration %s | Error: %s", i + 1, error)
                    break

                if i % 100 == 0:
                    logger.debug("[JacobianInverseKinematics] Iteration %s | Error: %s", i + 1, error)
